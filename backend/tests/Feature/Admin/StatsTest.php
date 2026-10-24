<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;

beforeEach(function () {
    $this->travelTo(now()->setDate(2026, 10, 20)->setTime(12, 0));
    $this->admin = User::factory()->admin()->create();
    $this->token = $this->admin->createToken('Pest')->plainTextToken;
});

it('is only for staff', function () {
    $this->getJson('/api/v1/admin/stats')->assertUnauthorized();

    $this->withToken(User::factory()->client()->create()->createToken('Pest')->plainTextToken)
        ->getJson('/api/v1/admin/stats')->assertForbidden();
});

it('counts registered users', function () {
    User::factory()->client()->count(2)->create(['created_at' => now()]);                   // today
    User::factory()->client()->create(['created_at' => now()->subDays(5)]);                 // 7 days
    User::factory()->client()->create(['created_at' => now()->subDays(20)]);                // 30 days
    User::factory()->client()->blocked()->create(['created_at' => now()->subDays(100)]);    // older, blocked
    User::factory()->admin()->create();

    $this->withToken($this->token)->getJson('/api/v1/admin/stats?period=7')
        ->assertOk()
        ->assertJsonPath('data.users', [
            'total' => 5, 'new_today' => 2, 'new_7_days' => 3, 'new_30_days' => 4,
            'new_in_period' => 3, 'blocked' => 1, 'staff' => 2, // two admins
        ])
        ->assertJsonPath('data.period.days', 7)
        ->assertJsonCount(7, 'data.charts')
        ->assertJsonPath('data.charts.6.date', '2026-10-20')
        ->assertJsonPath('data.charts.6.registrations', 2);
});

it('counts orders, revenue and top products', function () {
    $cement = Product::factory()->create(['name' => 'Цемент']);
    $make = function (OrderStatus $status, int $total, int $daysAgo, int $quantity) use ($cement) {
        $order = Order::factory()->status($status)->create(['total' => $total, 'subtotal' => $total, 'created_at' => now()->subDays($daysAgo)]);
        $order->items()->create(['product_id' => $cement->id, 'product_name' => 'Цемент', 'unit' => 'bag', 'price' => 1000, 'quantity' => $quantity, 'total' => $total]);
    };

    $make(OrderStatus::Completed, 500000, 1, 10);
    $make(OrderStatus::New, 300000, 0, 5);
    $make(OrderStatus::Cancelled, 900000, 0, 50);
    $make(OrderStatus::Completed, 200000, 60, 4); // outside 30 days

    $this->withToken($this->token)->getJson('/api/v1/admin/stats')
        ->assertOk()
        ->assertJsonPath('data.orders.total', 4)
        ->assertJsonPath('data.orders.in_period', 3)
        ->assertJsonPath('data.orders.awaiting', 1)
        ->assertJsonPath('data.revenue', [
            'completed_all_time' => 700000,
            'completed_in_period' => 500000,
            'orders_amount_in_period' => 800000,
            'average_check' => 400000,
        ])
        ->assertJsonPath('data.top_products.0', ['product_id' => $cement->id, 'name' => 'Цемент', 'quantity' => 15, 'amount' => 800000])
        ->assertJsonPath('data.charts.29.orders', 1)
        ->assertJsonPath('data.charts.29.amount', 300000);
});

it('validates the period', function () {
    $this->withToken($this->token)->getJson('/api/v1/admin/stats?period=365')->assertUnprocessable();
});
