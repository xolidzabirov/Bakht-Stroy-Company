<?php

declare(strict_types=1);

namespace App\Modules\Order\Database\Seeders;

use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Enums\PaymentMethod;
use App\Modules\Order\Enums\PaymentStatus;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Support\DeliveryPrice;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Addresses and an order history for the demo clients over the last 30 days,
 * so the admin dashboard shows real numbers (not in production).
 * Stock is not written off — these are history records.
 */
class DemoOrdersSeeder extends Seeder
{
    private const STREETS = ['пр. Рудаки', 'ул. Айни', 'пр. Исмоили Сомони', 'ул. Бохтар', 'ул. Шотемур', 'ул. Мирзо Турсунзаде'];

    public function run(): void
    {
        if (app()->isProduction() || Order::query()->exists()) {
            return;
        }

        mt_srand(2026);

        $clients = User::query()->role(Role::Client->value)->where('email', 'like', 'client%@example.com')->get();
        $products = Product::query()->active()->get();
        $statuses = [OrderStatus::Completed, OrderStatus::Completed, OrderStatus::Completed, OrderStatus::Delivering,
            OrderStatus::Confirmed, OrderStatus::New, OrderStatus::New, OrderStatus::Cancelled];

        if ($products->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($clients, $products, $statuses): void {
            foreach ($clients as $index => $client) {
                $address = Address::query()->firstOrCreate(
                    ['user_id' => $client->id, 'title' => 'Дом'],
                    ['city' => 'Душанбе', 'street' => self::STREETS[$index % count(self::STREETS)], 'house' => (string) (10 + $index * 7), 'apartment' => (string) (3 + $index), 'is_default' => true],
                );

                // Registration dates spread over the last 30 days for the chart.
                $client->forceFill(['created_at' => now()->subDays(29 - $index * 3)->setTime(9 + $index, 15)])->save();

                for ($i = 0, $count = mt_rand(1, 4); $i < $count; $i++) {
                    $this->order($client, $address, $products->random(mt_rand(1, 4)), $statuses[mt_rand(0, count($statuses) - 1)], mt_rand(0, 27 - $index * 2 > 0 ? 27 - $index * 2 : 0));
                }
            }
        });

        $this->command?->info('DemoOrdersSeeder: '.Order::query()->count().' orders.');
    }

    /**
     * @param  iterable<Product>  $lines
     */
    private function order(User $client, Address $address, iterable $lines, OrderStatus $status, int $daysAgo): void
    {
        $createdAt = now()->subDays($daysAgo)->setTime(mt_rand(9, 19), mt_rand(0, 59));
        $delivery = mt_rand(0, 3) > 0 ? DeliveryType::Delivery : DeliveryType::Pickup;

        $items = collect($lines)->map(fn (Product $product) => [
            'product' => $product,
            'quantity' => max($product->min_order_qty, $product->min_order_qty * mt_rand(1, 5)),
        ]);
        $subtotal = $items->sum(fn (array $line) => $line['product']->price * $line['quantity']);
        $deliveryPrice = DeliveryPrice::for($delivery, $subtotal);

        $order = Order::query()->create([
            'user_id' => $client->id,
            'status' => $status,
            'payment_method' => [PaymentMethod::Cash, PaymentMethod::CardOnDelivery, PaymentMethod::Transfer][mt_rand(0, 2)],
            'payment_status' => $status === OrderStatus::Completed ? PaymentStatus::Paid : PaymentStatus::Pending,
            'delivery_type' => $delivery,
            'address' => $delivery === DeliveryType::Delivery ? $address->toSnapshot() : null,
            'customer_name' => $client->name,
            'customer_phone' => (string) $client->phone,
            'customer_email' => $client->email,
            'subtotal' => $subtotal,
            'delivery_price' => $deliveryPrice,
            'total' => $subtotal + $deliveryPrice,
        ]);

        $order->forceFill([
            'number' => Order::formatNumber($order->id),
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
            'completed_at' => $status === OrderStatus::Completed ? $createdAt->copy()->addDays(2) : null,
            'cancelled_at' => $status === OrderStatus::Cancelled ? $createdAt->copy()->addHours(3) : null,
        ])->save();

        foreach ($items as $line) {
            $order->items()->create([
                'product_id' => $line['product']->id,
                'product_name' => $line['product']->name,
                'product_sku' => $line['product']->sku,
                'unit' => $line['product']->unit,
                'price' => $line['product']->price,
                'quantity' => $line['quantity'],
                'total' => $line['product']->price * $line['quantity'],
            ]);
        }

        // History: every step from "new" up to the current status.
        $path = match ($status) {
            OrderStatus::Cancelled => [OrderStatus::New, OrderStatus::Cancelled],
            default => array_slice([OrderStatus::New, OrderStatus::Confirmed, OrderStatus::Assembling, OrderStatus::Delivering, OrderStatus::Completed], 0,
                array_search($status, [OrderStatus::New, OrderStatus::Confirmed, OrderStatus::Assembling, OrderStatus::Delivering, OrderStatus::Completed], true) + 1),
        };

        foreach ($path as $step => $historyStatus) {
            $order->history()->create(['status' => $historyStatus])->forceFill(['created_at' => $createdAt->copy()->addHours($step * 6)])->save();
        }
    }
}
