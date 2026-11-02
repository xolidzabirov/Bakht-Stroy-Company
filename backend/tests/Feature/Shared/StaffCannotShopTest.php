<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;

it('keeps the shop team out of the cart, favorites and checkout', function (string $role) {
    $token = User::factory()->{$role}()->create()->createToken('Pest')->plainTextToken;
    $product = Product::factory()->create();

    $requests = [
        ['getJson', '/api/v1/cart', []],
        ['postJson', '/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1]],
        ['getJson', '/api/v1/favorites', []],
        ['postJson', "/api/v1/favorites/{$product->id}", []],
        ['postJson', '/api/v1/orders', ['delivery_type' => 'pickup', 'payment_method' => 'cash']],
    ];

    foreach ($requests as [$method, $url, $body]) {
        $this->withToken($token)->{$method}($url, $body)
            ->assertForbidden()
            ->assertJsonPath('code', 'STAFF_CANNOT_SHOP');
    }
})->with(['admin', 'manager']);

it('still lets customers use the cart', function () {
    $token = User::factory()->client()->create()->createToken('Pest')->plainTextToken;

    $this->withToken($token)->getJson('/api/v1/cart')->assertOk();
});
