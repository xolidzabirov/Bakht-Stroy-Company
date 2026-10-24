<?php

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;

beforeEach(function () {
    config(['shop.delivery.price' => 50000, 'shop.delivery.free_from' => 3000000]);
    $this->adminToken = User::factory()->admin()->create()->createToken('Pest')->plainTextToken;
});

it('shows public settings with defaults to guests', function () {
    $this->getJson('/api/v1/settings/public')
        ->assertOk()
        ->assertJsonPath('data.store.name', 'Bakht Stroy')
        ->assertJsonPath('data.delivery.price', 50000)
        ->assertJsonPath('data.delivery.free_from', 3000000);
});

it('lets the admin change any part of the settings', function () {
    $this->withToken($this->adminToken)->putJson('/api/v1/admin/settings', [
        'store' => [
            'phones' => ['90 123 45 67', '+998712000000'],
            'address' => 'Ташкент, ул. Янги Сергели, 15',
            'socials' => ['instagram' => 'https://instagram.com/bakhtstroycompany'],
        ],
        'delivery' => ['price' => 70000],
    ])
        ->assertOk()
        ->assertJsonPath('data.store.phones', ['+998901234567', '+998712000000'])
        ->assertJsonPath('data.store.socials.instagram', 'https://instagram.com/bakhtstroycompany')
        ->assertJsonPath('data.store.socials.telegram', null)
        ->assertJsonPath('data.delivery.price', 70000)
        ->assertJsonPath('data.delivery.free_from', 3000000);

    // A shorter list replaces the old one.
    $this->withToken($this->adminToken)->putJson('/api/v1/admin/settings', ['store' => ['phones' => ['+998901234567']]])
        ->assertJsonPath('data.store.phones', ['+998901234567'])
        ->assertJsonPath('data.store.address', 'Ташкент, ул. Янги Сергели, 15');

    $this->getJson('/api/v1/settings/public')->assertJsonPath('data.delivery.price', 70000);
});

it('applies new delivery prices to orders', function () {
    $this->withToken($this->adminToken)->putJson('/api/v1/admin/settings', ['delivery' => ['price' => 99000, 'free_from' => 0]])->assertOk();

    $client = User::factory()->client()->create(['phone' => '+998901234567']);
    CartItem::factory()->create(['user_id' => $client->id, 'product_id' => Product::factory()->create(['price' => 10000000, 'stock' => 5])->id]);

    $this->app['auth']->forgetGuards();
    $this->withToken($client->createToken('Pest')->plainTextToken)->postJson('/api/v1/orders', [
        'delivery_type' => 'delivery', 'payment_method' => 'cash',
        'address' => ['city' => 'Ташкент', 'street' => 'Навои', 'house' => '1'],
    ])->assertCreated()->assertJsonPath('data.delivery_price', 99000);
});

it('validates settings', function (array $payload, string $field) {
    $this->withToken($this->adminToken)->putJson('/api/v1/admin/settings', $payload)
        ->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    [['delivery' => ['price' => -5]], 'delivery.price'],
    [['store' => ['phones' => ['123']]], 'store.phones.0'],
    [['store' => ['email' => 'nope']], 'store.email'],
    [['store' => ['socials' => ['instagram' => 'javascript:alert(1)']]], 'store.socials.instagram'],
]);

it('closes settings for clients', function () {
    $this->withToken(User::factory()->client()->create()->createToken('Pest')->plainTextToken)
        ->putJson('/api/v1/admin/settings', ['delivery' => ['price' => 1]])
        ->assertForbidden();
});
