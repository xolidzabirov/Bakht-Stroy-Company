<?php

declare(strict_types=1);

namespace App\Modules\Admin\Actions;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Numbers and charts for the admin dashboard.
 * Revenue counts only completed orders; "orders amount" counts every not cancelled order.
 */
final class GetStats
{
    /**
     * @return array<string, mixed>
     */
    public function handle(int $days): array
    {
        $from = now()->startOfDay()->subDays($days - 1);

        return [
            'period' => ['days' => $days, 'from' => $from->toDateString(), 'to' => now()->toDateString()],
            'users' => $this->users($from),
            'orders' => $this->orders($from),
            'revenue' => $this->revenue($from),
            'top_products' => $this->topProducts($from),
            'catalog' => $this->catalog(),
            'charts' => $this->charts($from),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function users(Carbon $from): array
    {
        $clients = fn (): Builder => User::query()->role(Role::Client->value);

        return [
            /** Зарегистрированные покупатели. */
            'total' => $clients()->count(),
            'new_today' => $clients()->where('users.created_at', '>=', now()->startOfDay())->count(),
            'new_7_days' => $clients()->where('users.created_at', '>=', now()->startOfDay()->subDays(6))->count(),
            'new_30_days' => $clients()->where('users.created_at', '>=', now()->startOfDay()->subDays(29))->count(),
            'new_in_period' => $clients()->where('users.created_at', '>=', $from)->count(),
            'blocked' => $clients()->whereNotNull('blocked_at')->count(),
            'staff' => User::query()->role(array_map(fn (Role $role) => $role->value, Role::staff()))->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function orders(Carbon $from): array
    {
        /** @var array<string, int> $byStatus */
        $byStatus = Order::query()->toBase()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($total) => (int) $total)
            ->all();

        return [
            'total' => array_sum($byStatus),
            'in_period' => Order::query()->where('created_at', '>=', $from)->count(),
            /** Ждут обработки (статус «Новый»). */
            'awaiting' => $byStatus[OrderStatus::New->value] ?? 0,
            'by_status' => collect(OrderStatus::cases())->map(fn (OrderStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'count' => $byStatus[$status->value] ?? 0,
            ])->all(),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function revenue(Carbon $from): array
    {
        $notCancelled = Order::query()->where('status', '!=', OrderStatus::Cancelled)->where('created_at', '>=', $from);
        $count = (clone $notCancelled)->count();
        $amount = (int) (clone $notCancelled)->sum('total');

        return [
            /** Выполненные заказы за всё время, в дирамах. */
            'completed_all_time' => (int) Order::query()->where('status', OrderStatus::Completed)->sum('total'),
            /** Выполненные заказы за период, в дирамах. */
            'completed_in_period' => (int) Order::query()->where('status', OrderStatus::Completed)->where('created_at', '>=', $from)->sum('total'),
            /** Все неотменённые заказы за период, в дирамах. */
            'orders_amount_in_period' => $amount,
            'average_check' => $count > 0 ? intdiv($amount, $count) : 0,
        ];
    }

    /**
     * @return list<array{product_id: int|null, name: string, quantity: int, amount: int}>
     */
    private function topProducts(Carbon $from): array
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', '!=', OrderStatus::Cancelled->value)
            ->where('orders.created_at', '>=', $from)
            ->selectRaw('order_items.product_id, max(order_items.product_name) as name, sum(order_items.quantity) as quantity, sum(order_items.total) as amount')
            ->groupBy('order_items.product_id')
            ->orderByDesc('amount')
            ->limit(10)
            ->get()
            ->map(fn (object $row) => [
                'product_id' => $row->product_id !== null ? (int) $row->product_id : null,
                'name' => (string) $row->name,
                'quantity' => (int) $row->quantity,
                'amount' => (int) $row->amount,
            ])
            ->all();
    }

    /**
     * @return array<string, int>
     */
    private function catalog(): array
    {
        return [
            'products' => Product::query()->count(),
            'active_products' => Product::query()->active()->count(),
            'out_of_stock' => Product::query()->active()->whereColumn('stock', '<', 'min_order_qty')->count(),
            'low_stock' => Product::query()->active()->where('stock', '<=', (int) config('shop.low_stock_threshold'))->count(),
            'categories' => Category::query()->count(),
        ];
    }

    /**
     * Day-by-day series for charts, days without data are zeros.
     *
     * @return list<array{date: string, registrations: int, orders: int, amount: int}>
     */
    private function charts(Carbon $from): array
    {
        $registrations = User::query()->role(Role::Client->value)->toBase()
            ->where('users.created_at', '>=', $from)
            ->selectRaw('date(users.created_at) as day, count(*) as total')
            ->groupByRaw('date(users.created_at)')
            ->pluck('total', 'day');

        $orders = Order::query()->toBase()
            ->where('created_at', '>=', $from)
            ->where('status', '!=', OrderStatus::Cancelled->value)
            ->selectRaw('date(created_at) as day, count(*) as total, sum(total) as amount')
            ->groupByRaw('date(created_at)')
            ->get()
            ->keyBy('day');

        $series = [];

        foreach (CarbonPeriod::create($from, now()->startOfDay()) as $day) {
            $key = $day->toDateString();
            $order = $orders->get($key);

            $series[] = [
                'date' => $key,
                'registrations' => (int) ($registrations[$key] ?? 0),
                'orders' => (int) ($order->total ?? 0),
                'amount' => (int) ($order->amount ?? 0),
            ];
        }

        return $series;
    }
}
