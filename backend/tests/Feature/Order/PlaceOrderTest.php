<?php

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Notifications\NewOrderForStaffNotification;
use App\Modules\Order\Notifications\OrderPlacedNotification;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    config(['shop.delivery.price' => 50000, 'shop.delivery.free_from' => 3000000]);

    $this->user = User::factory()->client()->create(['name' => 'Халид', 'phone' => '+998901234567']);
    $this->token = $this->user->createToken('Pest')->plainTextToken;
    $this->cement = Product::factory()->create(['name' => 'Цемент М500', 'sku' => 'BS-000001', 'price' => 69000, 'stock' => 100]);
    $this->brick = Product::factory()->create(['name' => 'Кирпич', 'price' => 1300, 'stock' => 5000, 'min_order_qty' => 500]);
});

function fillCart(User $user, array $lines): void
{
    foreach ($lines as [$product, $quantity]) {
        CartItem::factory()->create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => $quantity]);
    }
}

function checkout(object $test, array $overrides = [])
{
    return $test->withToken($test->token)->postJson('/api/v1/orders', array_merge([
        'delivery_type' => 'delivery',
        'payment_method' => 'cash',
        'address' => ['city' => 'Ташкент', 'street' => 'ул. Амира Темура', 'house' => '15', 'apartment' => '42'],
        'comment' => 'Позвонить за час',
    ], $overrides));
}

it('places an order from the cart', function () {
    Notification::fake();
    fillCart($this->user, [[$this->cement, 10], [$this->brick, 500]]);

    $response = checkout($this)->assertCreated();
    $order = Order::query()->sole();

    $response->assertJsonPath('data.number', sprintf('BS-%06d', $order->id))
        ->assertJsonPath('data.status.value', 'new')
        ->assertJsonPath('data.status.label', 'Новый')
        ->assertJsonPath('data.subtotal', 10 * 69000 + 500 * 1300)
        ->assertJsonPath('data.delivery_price', 50000)
        ->assertJsonPath('data.total', 10 * 69000 + 500 * 1300 + 50000)
        ->assertJsonPath('data.customer.name', 'Халид')
        ->assertJsonPath('data.customer.phone', '+998901234567')
        ->assertJsonPath('data.address.city', 'Ташкент')
        ->assertJsonPath('data.items.0.name', 'Цемент М500')
        ->assertJsonPath('data.items.0.sku', 'BS-000001')
        ->assertJsonPath('data.items.0.price', 69000)
        ->assertJsonPath('data.items.0.quantity', 10)
        ->assertJsonPath('data.history.0.status.value', 'new')
        ->assertJsonPath('data.can_cancel', true);

    expect($this->cement->refresh()->stock)->toBe(90)
        ->and($this->brick->refresh()->stock)->toBe(4500)
        ->and(CartItem::query()->count())->toBe(0);
});

it('makes delivery free from the threshold and for pickup', function () {
    fillCart($this->user, [[$this->cement, 50]]); // 3 450 000

    checkout($this)->assertCreated()->assertJsonPath('data.delivery_price', 0);

    fillCart($this->user, [[$this->cement, 1]]);
    checkout($this, ['delivery_type' => 'pickup', 'address' => null])
        ->assertCreated()
        ->assertJsonPath('data.delivery_price', 0)
        ->assertJsonPath('data.address', null);
});

it('keeps prices and names of the moment of order', function () {
    fillCart($this->user, [[$this->cement, 1]]);
    $number = checkout($this)->json('data.number');

    $this->cement->update(['name' => 'Новое имя', 'price' => 99000]);
    $this->cement->delete();

    $this->withToken($this->token)->getJson("/api/v1/orders/{$number}")
        ->assertOk()
        ->assertJsonPath('data.items.0.name', 'Цемент М500')
        ->assertJsonPath('data.items.0.price', 69000)
        ->assertJsonPath('data.items.0.product_slug', null);
});

it('refuses an empty cart', function () {
    checkout($this)->assertUnprocessable()->assertJsonPath('code', 'CART_EMPTY');
});

it('refuses when some lines cannot be ordered and changes nothing', function () {
    fillCart($this->user, [[$this->cement, 10], [$this->brick, 500]]);
    $this->cement->update(['stock' => 3]);

    checkout($this)
        ->assertConflict()
        ->assertJsonPath('code', 'CART_HAS_PROBLEMS')
        ->assertJsonPath('details.0.product_name', 'Цемент М500')
        ->assertJsonPath('details.0.problem', 'not_enough_stock')
        ->assertJsonPath('details.0.available', 3)
        ->assertJsonCount(1, 'details');

    expect(Order::query()->count())->toBe(0)
        ->and($this->brick->refresh()->stock)->toBe(5000)
        ->and(CartItem::query()->count())->toBe(2);
});

it('sells the last unit only once', function () {
    $this->cement->update(['stock' => 1]);
    $other = User::factory()->client()->create(['phone' => '+998901111111']);
    fillCart($this->user, [[$this->cement, 1]]);
    fillCart($other, [[$this->cement, 1]]);

    checkout($this)->assertCreated();

    $this->app['auth']->forgetGuards();
    $this->withToken($other->createToken('Pest')->plainTextToken)
        ->postJson('/api/v1/orders', ['delivery_type' => 'pickup', 'payment_method' => 'cash'])
        ->assertConflict()
        ->assertJsonPath('details.0.problem', 'not_enough_stock');

    expect($this->cement->refresh()->stock)->toBe(0);
});

it('validates the checkout form', function (array $overrides, string $field) {
    fillCart($this->user, [[$this->cement, 1]]);

    checkout($this, $overrides)->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    'unknown delivery' => [['delivery_type' => 'drone'], 'delivery_type'],
    'unknown payment' => [['payment_method' => 'bitcoin'], 'payment_method'],
    'delivery without address' => [['address' => null], 'address'],
    'delivery without city' => [['address' => ['street' => 'x', 'house' => '1']], 'address.city'],
    'bad phone' => [['customer_phone' => '123'], 'customer_phone'],
]);

it('requires a phone when the profile has none', function () {
    $this->user->update(['phone' => null]);
    fillCart($this->user, [[$this->cement, 1]]);

    checkout($this)->assertUnprocessable()->assertJsonValidationErrors('customer_phone');
    checkout($this, ['customer_phone' => '90 765 43 21', 'customer_name' => 'Получатель'])
        ->assertCreated()
        ->assertJsonPath('data.customer.phone', '+998907654321')
        ->assertJsonPath('data.customer.name', 'Получатель');
});

it('notifies the client and the staff', function () {
    Notification::fake();
    $admin = User::factory()->admin()->create();
    $manager = User::factory()->manager()->create();
    $blockedAdmin = User::factory()->admin()->blocked()->create();
    fillCart($this->user, [[$this->cement, 1]]);

    checkout($this)->assertCreated();

    Notification::assertSentTo($this->user, OrderPlacedNotification::class);
    Notification::assertSentTo([$admin, $manager], NewOrderForStaffNotification::class);
    Notification::assertNotSentTo($blockedAdmin, NewOrderForStaffNotification::class);
});
