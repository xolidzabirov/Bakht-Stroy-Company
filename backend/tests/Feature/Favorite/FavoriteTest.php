<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;

beforeEach(function () {
    $this->user = User::factory()->client()->create();
    $this->token = $this->user->createToken('Pest')->plainTextToken;
    $this->product = Product::factory()->create(['name' => 'Цемент']);
});

it('requires login', function () {
    $this->getJson('/api/v1/favorites')->assertUnauthorized();
    $this->postJson("/api/v1/favorites/{$this->product->id}")->assertUnauthorized();
});

it('adds, lists and removes favorites idempotently', function () {
    $second = Product::factory()->create(['name' => 'Кирпич']);

    $this->withToken($this->token)->postJson("/api/v1/favorites/{$this->product->id}")->assertNoContent();
    $this->withToken($this->token)->postJson("/api/v1/favorites/{$this->product->id}")->assertNoContent();
    $this->travel(1)->second();
    $this->withToken($this->token)->postJson("/api/v1/favorites/{$second->id}")->assertNoContent();

    $this->withToken($this->token)->getJson('/api/v1/favorites')
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('data.0.name', 'Кирпич') // latest first
        ->assertJsonPath('data.0.is_favorite', true);

    $this->withToken($this->token)->deleteJson("/api/v1/favorites/{$this->product->id}")->assertNoContent();
    $this->withToken($this->token)->deleteJson("/api/v1/favorites/{$this->product->id}")->assertNoContent();

    $this->withToken($this->token)->getJson('/api/v1/favorites')->assertJsonPath('meta.total', 1);
});

it('does not add hidden or missing products', function () {
    $hidden = Product::factory()->inactive()->create();

    $this->withToken($this->token)->postJson("/api/v1/favorites/{$hidden->id}")->assertNotFound();
    $this->withToken($this->token)->postJson('/api/v1/favorites/999999')->assertNotFound();
});

it('hides favorites that are no longer sold', function () {
    $this->withToken($this->token)->postJson("/api/v1/favorites/{$this->product->id}");
    $this->product->update(['is_active' => false]);

    $this->withToken($this->token)->getJson('/api/v1/favorites')->assertJsonPath('meta.total', 0);
});

it('marks favorites in the catalog only for their owner', function () {
    $this->withToken($this->token)->postJson("/api/v1/favorites/{$this->product->id}");

    $this->withToken($this->token)->getJson("/api/v1/products/{$this->product->slug}")
        ->assertJsonPath('data.is_favorite', true);

    $this->app['auth']->forgetGuards();
    $other = User::factory()->client()->create()->createToken('Pest')->plainTextToken;
    $this->withToken($other)->getJson('/api/v1/products')->assertJsonPath('data.0.is_favorite', false);

    $this->app['auth']->forgetGuards();
    $this->withoutToken()->getJson('/api/v1/products')->assertJsonPath('data.0.is_favorite', false);
});

it('keeps favorites of each user separate', function () {
    $this->withToken($this->token)->postJson("/api/v1/favorites/{$this->product->id}");

    $this->app['auth']->forgetGuards();
    $other = User::factory()->client()->create()->createToken('Pest')->plainTextToken;

    $this->withToken($other)->getJson('/api/v1/favorites')->assertJsonPath('meta.total', 0);
});
