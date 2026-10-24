<?php

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;

beforeEach(function () {
    $this->user = User::factory()->client()->create();
    $this->token = $this->user->createToken('Pest')->plainTextToken;
    $this->cement = Product::factory()->create(['name' => 'Цемент', 'price' => 69000, 'stock' => 100, 'min_order_qty' => 1]);
    $this->brick = Product::factory()->create(['name' => 'Кирпич', 'price' => 1300, 'stock' => 5000, 'min_order_qty' => 500]);
});

function addToCart(object $test, int $productId, int $quantity = 1)
{
    return $test->withToken($test->token)->postJson('/api/v1/cart/items', ['product_id' => $productId, 'quantity' => $quantity]);
}

it('requires login: guests can only browse', function () {
    $this->getJson('/api/v1/cart')->assertUnauthorized();
    $this->postJson('/api/v1/cart/items', ['product_id' => $this->cement->id])->assertUnauthorized();
});

it('starts empty', function () {
    $this->withToken($this->token)->getJson('/api/v1/cart')
        ->assertOk()
        ->assertExactJson(['data' => ['items' => [], 'items_count' => 0, 'subtotal' => 0, 'has_problems' => false, 'can_checkout' => false]]);
});

it('adds products and sums the quantity of the same product', function () {
    addToCart($this, $this->cement->id, 10)->assertOk();
    addToCart($this, $this->cement->id, 5)->assertOk();
    addToCart($this, $this->brick->id, 500)
        ->assertOk()
        ->assertJsonPath('data.items_count', 2)
        ->assertJsonPath('data.items.0.quantity', 15)
        ->assertJsonPath('data.items.0.total', 15 * 69000)
        ->assertJsonPath('data.items.0.product.name', 'Цемент')
        ->assertJsonPath('data.subtotal', 15 * 69000 + 500 * 1300)
        ->assertJsonPath('data.can_checkout', true);
});

it('does not add more than in stock or less than the minimum order', function () {
    addToCart($this, $this->cement->id, 101)
        ->assertConflict()
        ->assertJsonPath('code', 'NOT_ENOUGH_STOCK')
        ->assertJsonPath('details.available', 100);

    addToCart($this, $this->cement->id, 60);
    addToCart($this, $this->cement->id, 60)->assertConflict(); // 120 in total

    addToCart($this, $this->brick->id, 100)
        ->assertUnprocessable()
        ->assertJsonPath('code', 'BELOW_MIN_ORDER')
        ->assertJsonPath('details.min_order_qty', 500);
});

it('does not add hidden products', function () {
    $hidden = Product::factory()->inactive()->create();

    addToCart($this, $hidden->id)->assertUnprocessable()->assertJsonPath('code', 'PRODUCT_UNAVAILABLE');
    addToCart($this, 999999)->assertUnprocessable()->assertJsonPath('code', 'PRODUCT_UNAVAILABLE');
});

it('changes the quantity and removes lines', function () {
    addToCart($this, $this->cement->id, 2);
    $itemId = CartItem::query()->sole()->id;

    $this->withToken($this->token)->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 7])
        ->assertOk()->assertJsonPath('data.items.0.quantity', 7);
    $this->withToken($this->token)->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 1000])
        ->assertConflict();
    $this->withToken($this->token)->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 0])
        ->assertUnprocessable();

    $this->withToken($this->token)->deleteJson("/api/v1/cart/items/{$itemId}")
        ->assertOk()->assertJsonPath('data.items_count', 0);
});

it('does not let users touch someone else\'s cart', function () {
    $foreign = CartItem::factory()->create(['product_id' => $this->cement->id]);

    $this->withToken($this->token)->patchJson("/api/v1/cart/items/{$foreign->id}", ['quantity' => 2])->assertNotFound();
    $this->withToken($this->token)->deleteJson("/api/v1/cart/items/{$foreign->id}")->assertNotFound();

    expect($foreign->fresh())->not->toBeNull();
});

it('clears the cart', function () {
    addToCart($this, $this->cement->id);
    addToCart($this, $this->brick->id, 500);

    $this->withToken($this->token)->deleteJson('/api/v1/cart')->assertNoContent();

    expect(CartItem::query()->count())->toBe(0);
});

it('marks lines that can no longer be ordered and excludes them from the total', function () {
    addToCart($this, $this->cement->id, 50);
    addToCart($this, $this->brick->id, 500);

    $this->cement->update(['stock' => 10]);
    $this->brick->delete();

    $this->withToken($this->token)->getJson('/api/v1/cart')
        ->assertOk()
        ->assertJsonPath('data.items.0.problem', 'not_enough_stock')
        ->assertJsonPath('data.items.1.problem', 'unavailable')
        ->assertJsonPath('data.subtotal', 0)
        ->assertJsonPath('data.has_problems', true)
        ->assertJsonPath('data.can_checkout', false);
});

it('shows current prices', function () {
    addToCart($this, $this->cement->id, 2);
    $this->cement->update(['price' => 75000]);

    $this->withToken($this->token)->getJson('/api/v1/cart')->assertJsonPath('data.subtotal', 150000);
});
