<?php

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;

beforeEach(function () {
    $this->user = User::factory()->client()->create(['phone' => '+998901234567']);
    $this->token = $this->user->createToken('Pest')->plainTextToken;
});

function addressPayload(array $overrides = []): array
{
    return array_merge(['title' => 'Объект', 'city' => 'Ташкент', 'street' => 'ул. Бунёдкор', 'house' => '12А', 'apartment' => '45'], $overrides);
}

it('makes the first address the default one', function () {
    $this->withToken($this->token)->postJson('/api/v1/me/addresses', addressPayload())
        ->assertCreated()
        ->assertJsonPath('data.is_default', true)
        ->assertJsonPath('data.full', 'Ташкент, ул. Бунёдкор, д. 12А, кв. 45');

    $this->withToken($this->token)->postJson('/api/v1/me/addresses', addressPayload(['title' => 'Дача']))
        ->assertCreated()
        ->assertJsonPath('data.is_default', false);
});

it('keeps exactly one default address', function () {
    $first = Address::factory()->for($this->user)->default()->create();
    $second = Address::factory()->for($this->user)->create();

    $this->withToken($this->token)->postJson("/api/v1/me/addresses/{$second->id}/default")->assertOk()->assertJsonPath('data.is_default', true);

    expect($first->refresh()->is_default)->toBeFalse();

    $this->withToken($this->token)->postJson('/api/v1/me/addresses', addressPayload(['is_default' => true]))->assertCreated();

    expect(Address::query()->where('is_default', true)->count())->toBe(1);
});

it('lists my addresses with the default first', function () {
    Address::factory()->for($this->user)->create(['title' => 'Старый']);
    Address::factory()->for($this->user)->default()->create(['title' => 'Основной']);
    Address::factory()->create(); // someone else's

    $this->withToken($this->token)->getJson('/api/v1/me/addresses')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.title', 'Основной');
});

it('updates and deletes an address, moving the default', function () {
    $old = Address::factory()->for($this->user)->create();
    $default = Address::factory()->for($this->user)->default()->create();

    $this->withToken($this->token)->patchJson("/api/v1/me/addresses/{$default->id}", ['house' => '99', 'apartment' => ''])
        ->assertOk()
        ->assertJsonPath('data.house', '99')
        ->assertJsonPath('data.apartment', null)
        ->assertJsonPath('data.is_default', true);

    $this->withToken($this->token)->deleteJson("/api/v1/me/addresses/{$default->id}")->assertNoContent();

    expect($old->refresh()->is_default)->toBeTrue();
});

it('does not let users touch other addresses', function () {
    $foreign = Address::factory()->create();

    $this->withToken($this->token)->patchJson("/api/v1/me/addresses/{$foreign->id}", ['house' => '1'])->assertNotFound();
    $this->withToken($this->token)->deleteJson("/api/v1/me/addresses/{$foreign->id}")->assertNotFound();
    $this->withToken($this->token)->postJson("/api/v1/me/addresses/{$foreign->id}/default")->assertNotFound();
});

it('limits addresses to 10 and validates them', function () {
    Address::factory()->for($this->user)->count(10)->create();

    $this->withToken($this->token)->postJson('/api/v1/me/addresses', addressPayload())
        ->assertUnprocessable()->assertJsonPath('code', 'TOO_MANY_ADDRESSES');

    $this->withToken($this->token)->postJson('/api/v1/me/addresses', ['city' => 'Ташкент'])
        ->assertUnprocessable()->assertJsonValidationErrors(['street', 'house']);
});

it('places an order to a saved address', function () {
    $address = Address::factory()->for($this->user)->create(['city' => 'Самарканд', 'street' => 'ул. Регистан', 'house' => '7']);
    $foreign = Address::factory()->create();
    $product = Product::factory()->create(['stock' => 10]);
    CartItem::factory()->create(['user_id' => $this->user->id, 'product_id' => $product->id]);

    $this->withToken($this->token)
        ->postJson('/api/v1/orders', ['delivery_type' => 'delivery', 'payment_method' => 'cash', 'address_id' => $foreign->id])
        ->assertUnprocessable()->assertJsonValidationErrors('address_id');

    $this->withToken($this->token)
        ->postJson('/api/v1/orders', ['delivery_type' => 'delivery', 'payment_method' => 'cash', 'address_id' => $address->id])
        ->assertCreated()
        ->assertJsonPath('data.address.city', 'Самарканд')
        ->assertJsonPath('data.address.street', 'ул. Регистан');
});
