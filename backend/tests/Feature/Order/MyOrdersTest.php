<?php

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Actions\ChangeOrderStatus;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Exceptions\InvalidStatusTransitionException;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Notifications\OrderStatusChangedNotification;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->user = User::factory()->client()->create(['phone' => '+998901234567']);
    $this->token = $this->user->createToken('Pest')->plainTextToken;
    $this->cement = Product::factory()->create(['name' => 'Цемент', 'price' => 69000, 'stock' => 100]);
});

function placeOrder(object $test, int $quantity = 10): string
{
    CartItem::factory()->create(['user_id' => $test->user->id, 'product_id' => $test->cement->id, 'quantity' => $quantity]);

    return $test->withToken($test->token)
        ->postJson('/api/v1/orders', ['delivery_type' => 'pickup', 'payment_method' => 'cash'])
        ->assertCreated()
        ->json('data.number');
}

it('lists only my orders, newest first, with status filter', function () {
    $first = placeOrder($this, 1);
    $second = placeOrder($this, 1);
    Order::factory()->create(); // someone else's
    app(ChangeOrderStatus::class)->handle(Order::query()->where('number', $first)->sole(), OrderStatus::Confirmed);

    $this->withToken($this->token)->getJson('/api/v1/orders')
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('data.0.number', $second)
        ->assertJsonPath('data.0.items_count', 1);

    $this->withToken($this->token)->getJson('/api/v1/orders?status=confirmed')->assertJsonPath('meta.total', 1);
    $this->withToken($this->token)->getJson('/api/v1/orders?status=active')->assertJsonPath('meta.total', 2);
    $this->withToken($this->token)->getJson('/api/v1/orders?status=lost')->assertUnprocessable();
});

it('hides orders of other users', function () {
    $foreign = Order::factory()->create();

    $this->withToken($this->token)->getJson("/api/v1/orders/{$foreign->number}")->assertNotFound();
    $this->withToken($this->token)->postJson("/api/v1/orders/{$foreign->number}/cancel")->assertNotFound();
    $this->withToken($this->token)->postJson("/api/v1/orders/{$foreign->number}/repeat")->assertNotFound();
});

it('lets the client cancel a new order and returns the stock', function () {
    Notification::fake();
    $number = placeOrder($this, 10);

    expect($this->cement->refresh()->stock)->toBe(90);

    $this->withToken($this->token)->postJson("/api/v1/orders/{$number}/cancel", ['reason' => 'Передумал'])
        ->assertOk()
        ->assertJsonPath('data.status.value', 'cancelled')
        ->assertJsonPath('data.can_cancel', false)
        ->assertJsonPath('data.history.1.comment', 'Отменён покупателем: Передумал');

    expect($this->cement->refresh()->stock)->toBe(100);

    Notification::assertNotSentTo($this->user, OrderStatusChangedNotification::class);
});

it('does not let the client cancel an order in progress', function () {
    $number = placeOrder($this);
    app(ChangeOrderStatus::class)->handle(Order::query()->where('number', $number)->sole(), OrderStatus::Confirmed);

    $this->withToken($this->token)->postJson("/api/v1/orders/{$number}/cancel")
        ->assertConflict()
        ->assertJsonPath('code', 'ORDER_CANNOT_BE_CANCELLED');
});

it('repeats an order into the cart as far as stock allows', function () {
    $number = placeOrder($this, 30);
    $brick = Product::factory()->create(['name' => 'Кирпич', 'stock' => 0]);
    Order::query()->where('number', $number)->sole()->items()->create([
        'product_id' => $brick->id, 'product_name' => 'Кирпич', 'unit' => 'piece', 'price' => 1300, 'quantity' => 500, 'total' => 650000,
    ]);
    $this->cement->update(['stock' => 20]);

    $this->withToken($this->token)->postJson("/api/v1/orders/{$number}/repeat")
        ->assertOk()
        ->assertJsonPath('data.cart.items.0.quantity', 20)
        ->assertJsonPath('data.skipped', [
            ['product_name' => 'Цемент', 'reason' => 'partially_added'],
            ['product_name' => 'Кирпич', 'reason' => 'out_of_stock'],
        ]);
});

it('finds an order by number in any letter case', function () {
    $number = placeOrder($this);

    $this->withToken($this->token)->getJson('/api/v1/orders/'.strtolower($number))->assertOk();
});

it('moves orders only along allowed statuses and keeps history', function () {
    Notification::fake();
    $order = Order::query()->where('number', placeOrder($this))->sole();
    $change = app(ChangeOrderStatus::class);

    $change->handle($order, OrderStatus::Confirmed, comment: 'Подтвердили по телефону');
    $change->handle($order, OrderStatus::Assembling);
    $change->handle($order, OrderStatus::Delivering);
    $order = $change->handle($order, OrderStatus::Completed);

    expect($order->status)->toBe(OrderStatus::Completed)
        ->and($order->completed_at)->not->toBeNull()
        ->and($order->history()->pluck('status')->map->value->all())
        ->toBe(['new', 'confirmed', 'assembling', 'delivering', 'completed']);

    Notification::assertSentToTimes($this->user, OrderStatusChangedNotification::class, 4);

    expect(fn () => $change->handle($order, OrderStatus::Cancelled))->toThrow(InvalidStatusTransitionException::class);
});

it('returns stock when staff cancels an order', function () {
    $order = Order::query()->where('number', placeOrder($this, 10))->sole();

    app(ChangeOrderStatus::class)->handle($order, OrderStatus::Confirmed);
    app(ChangeOrderStatus::class)->handle($order, OrderStatus::Cancelled, comment: 'Клиент не отвечает');

    expect($this->cement->refresh()->stock)->toBe(100)
        ->and($order->refresh()->cancelled_at)->not->toBeNull();
});
