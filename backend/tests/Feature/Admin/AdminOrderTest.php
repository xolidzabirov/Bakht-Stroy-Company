<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Enums\PaymentStatus;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Notifications\OrderStatusChangedNotification;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create(['name' => 'Админ Азиз']);
    $this->token = $this->admin->createToken('Pest')->plainTextToken;
    $this->client = User::factory()->client()->create();
});

it('is closed for clients', function () {
    $this->withToken($this->client->createToken('Pest')->plainTextToken)->getJson('/api/v1/admin/orders')->assertForbidden();
});

it('lists all orders with filters and search', function () {
    Order::factory()->for($this->client)->create(['customer_name' => 'Алишер', 'customer_phone' => '+998901112233', 'created_at' => now()->subDays(10)]);
    Order::factory()->status(OrderStatus::Completed)->create(['customer_name' => 'Мадина']);
    Order::factory()->status(OrderStatus::Delivering)->create(['customer_email' => 'boss@stroy.uz']);

    $get = fn (string $query = '') => $this->withToken($this->token)->getJson('/api/v1/admin/orders'.$query)->assertOk();

    expect($get()->json('meta.total'))->toBe(3)
        ->and($get('?status=active')->json('meta.total'))->toBe(2)
        ->and($get('?status=completed')->json('data.0.customer.name'))->toBe('Мадина')
        ->and($get('?search='.urlencode('алишер'))->json('meta.total'))->toBe(1)
        ->and($get('?search=1112233')->json('meta.total'))->toBe(1)
        ->and($get('?search=boss@')->json('meta.total'))->toBe(1)
        ->and($get('?date_from='.now()->subDays(2)->toDateString())->json('meta.total'))->toBe(2)
        ->and($get('?user_id='.$this->client->id)->json('data.0.user.id'))->toBe($this->client->id);
});

it('shows an order with the customer and allowed next statuses', function () {
    $order = Order::factory()->for($this->client)->create();

    $this->withToken($this->token)->getJson("/api/v1/admin/orders/{$order->id}")
        ->assertOk()
        ->assertJsonPath('data.user.email', $this->client->email)
        ->assertJsonPath('data.next_statuses', [
            ['value' => 'confirmed', 'label' => 'Подтверждён'],
            ['value' => 'cancelled', 'label' => 'Отменён'],
        ]);
});

it('changes the status, writes the author and notifies the client', function () {
    Notification::fake();
    $order = Order::factory()->for($this->client)->create();

    $this->withToken($this->token)->patchJson("/api/v1/admin/orders/{$order->id}/status", [
        'status' => 'confirmed', 'comment' => 'Доставка завтра',
    ])
        ->assertOk()
        ->assertJsonPath('data.status.value', 'confirmed')
        ->assertJsonPath('data.history.0.status.value', 'confirmed')
        ->assertJsonPath('data.history.0.comment', 'Доставка завтра')
        ->assertJsonPath('data.history.0.author.name', 'Админ Азиз');

    Notification::assertSentTo($this->client, OrderStatusChangedNotification::class);
});

it('rejects skipping statuses', function () {
    $order = Order::factory()->for($this->client)->create();

    $this->withToken($this->token)->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'completed'])
        ->assertConflict()
        ->assertJsonPath('code', 'INVALID_STATUS_TRANSITION')
        ->assertJsonPath('details.allowed', ['confirmed', 'cancelled']);
});

it('returns stock when staff cancels', function () {
    $product = Product::factory()->create(['stock' => 5]);
    $order = Order::factory()->for($this->client)->status(OrderStatus::Confirmed)->create();
    $order->items()->create(['product_id' => $product->id, 'product_name' => 'X', 'unit' => 'bag', 'price' => 1, 'quantity' => 7, 'total' => 7]);

    $this->withToken($this->token)->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'cancelled'])->assertOk();

    expect($product->refresh()->stock)->toBe(12);
});

it('changes the payment status', function () {
    $order = Order::factory()->create();

    $this->withToken($this->token)->patchJson("/api/v1/admin/orders/{$order->id}/payment", ['payment_status' => 'paid'])
        ->assertOk()->assertJsonPath('data.payment_status.value', 'paid');

    expect($order->refresh()->payment_status)->toBe(PaymentStatus::Paid);

    $this->withToken($this->token)->patchJson("/api/v1/admin/orders/{$order->id}/payment", ['payment_status' => 'stolen'])
        ->assertUnprocessable();
});
