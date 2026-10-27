<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Controllers\Admin;

use App\Modules\Order\Actions\ChangeOrderStatus;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Enums\PaymentStatus;
use App\Modules\Order\Exceptions\InvalidStatusTransitionException;
use App\Modules\Order\Http\Requests\Admin\AdminOrderIndexRequest;
use App\Modules\Order\Http\Requests\Admin\ChangeOrderStatusRequest;
use App\Modules\Order\Http\Resources\AdminOrderResource;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

#[Group('Админ: заказы', weight: 13)]
final class OrderController extends Controller
{
    /**
     * Все заказы
     *
     * Новые сверху. Фильтры по статусу, оплате, доставке, датам и поиск по номеру, телефону, имени, email.
     */
    public function index(AdminOrderIndexRequest $request): AnonymousResourceCollection
    {
        $status = $request->string('status')->toString();
        $search = trim($request->string('search')->toString());

        $orders = Order::query()
            ->with('user')
            ->withCount('items')
            ->when($status === 'active', fn (Builder $q) => $q->whereNotIn('status', [OrderStatus::Completed, OrderStatus::Cancelled]))
            ->when($status !== '' && $status !== 'active', fn (Builder $q) => $q->where('status', $status))
            ->when($request->filled('payment_status'), fn (Builder $q) => $q->where('payment_status', $request->input('payment_status')))
            ->when($request->filled('delivery_type'), fn (Builder $q) => $q->where('delivery_type', $request->input('delivery_type')))
            ->when($request->filled('date_from'), fn (Builder $q) => $q->where('created_at', '>=', Carbon::parse($request->string('date_from')->toString())->startOfDay()))
            ->when($request->filled('date_to'), fn (Builder $q) => $q->where('created_at', '<=', Carbon::parse($request->string('date_to')->toString())->endOfDay()))
            ->when($request->filled('user_id'), fn (Builder $q) => $q->where('user_id', $request->integer('user_id')))
            ->when($search !== '', fn (Builder $q) => $this->search($q, $search))
            ->latest('id')
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return AdminOrderResource::collection($orders);
    }

    /**
     * Заказ
     *
     * С покупателем, товарами, историей статусов (кто менял) и списком доступных следующих статусов.
     */
    public function show(Order $order): AdminOrderResource
    {
        return AdminOrderResource::make($order->load(['user', 'items.product.media', 'history.author']));
    }

    /**
     * Заказ по номеру
     *
     * То же, что «Заказ», но по номеру, который видят покупатель и менеджер (BS-000025).
     */
    public function showByNumber(string $number): AdminOrderResource
    {
        return $this->show(Order::query()->where('number', mb_strtoupper(trim($number)))->firstOrFail());
    }

    /**
     * Сменить статус
     *
     * Только по порядку: new → confirmed → assembling → delivering → completed; отмена — из любого активного
     * (товары возвращаются на склад). Покупатель получает уведомление.
     *
     * @throws InvalidStatusTransitionException
     */
    public function changeStatus(ChangeOrderStatusRequest $request, Order $order, #[CurrentUser] User $staff, ChangeOrderStatus $changeStatus): AdminOrderResource
    {
        $order = $changeStatus->handle(
            $order,
            OrderStatus::from($request->string('status')->toString()),
            $staff,
            $request->filled('comment') ? trim($request->string('comment')->toString()) : null,
        );

        return AdminOrderResource::make($order->load(['user', 'items.product.media', 'history.author']));
    }

    /**
     * Изменить статус оплаты
     *
     * pending — ожидает, paid — оплачен, refunded — возвращён.
     */
    public function changePayment(Request $request, Order $order): AdminOrderResource
    {
        $request->validate(['payment_status' => ['required', Rule::enum(PaymentStatus::class)]]);

        $order->update(['payment_status' => PaymentStatus::from($request->string('payment_status')->toString())]);

        return AdminOrderResource::make($order->load(['user', 'items.product.media', 'history.author']));
    }

    /**
     * @param  Builder<Order>  $query
     */
    private function search(Builder $query, string $search): void
    {
        $like = '%'.addcslashes(mb_strtolower($search), '%_\\').'%';
        $digits = (string) preg_replace('/\D+/', '', $search);

        $query->where(function (Builder $q) use ($like, $digits, $search) {
            $q->whereRaw('lower(number) like ?', [$like])
                ->orWhereRaw('lower(customer_name) like ?', [$like])
                ->orWhereRaw('lower(customer_email) like ?', [$like]);

            if (strlen($digits) >= 4) {
                $q->orWhere('customer_phone', 'like', '%'.$digits.'%');
            }

            if (ctype_digit($search)) {
                $q->orWhere('id', (int) $search);
            }
        });
    }
}
