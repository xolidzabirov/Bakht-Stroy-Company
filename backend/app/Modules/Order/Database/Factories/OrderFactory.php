<?php

declare(strict_types=1);

namespace App\Modules\Order\Database\Factories;

use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Enums\PaymentMethod;
use App\Modules\Order\Enums\PaymentStatus;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(1, 100) * 10000;

        return [
            'user_id' => User::factory(),
            'status' => OrderStatus::New,
            'payment_method' => PaymentMethod::Cash,
            'payment_status' => PaymentStatus::Pending,
            'delivery_type' => DeliveryType::Pickup,
            'address' => null,
            'customer_name' => fake()->name(),
            'customer_phone' => '+99293'.fake()->numerify('#######'),
            'customer_email' => fake()->safeEmail(),
            'subtotal' => $subtotal,
            'delivery_price' => 0,
            'discount' => 0,
            'total' => $subtotal,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Order $order) {
            $order->forceFill(['number' => Order::formatNumber($order->id)])->save();
        });
    }

    public function status(OrderStatus $status): static
    {
        return $this->state(fn (array $attributes) => ['status' => $status]);
    }
}
