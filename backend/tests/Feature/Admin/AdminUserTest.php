<?php

use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create(['name' => 'Админ']);
    $this->token = $this->admin->createToken('Pest')->plainTextToken;
});

it('lists registered users with order totals', function () {
    $alisher = User::factory()->client()->create(['name' => 'Алишер', 'email' => 'alisher@gmail.com', 'phone' => '+998901112233']);
    Order::factory()->for($alisher)->status(OrderStatus::Completed)->create(['total' => 500000]);
    Order::factory()->for($alisher)->status(OrderStatus::Cancelled)->create(['total' => 900000]);
    User::factory()->client()->blocked()->create(['name' => 'Мадина']);

    $response = $this->withToken($this->token)->getJson('/api/v1/admin/users?role=client&sort=orders')->assertOk();

    expect($response->json('meta.total'))->toBe(2)
        ->and($response->json('data.0.name'))->toBe('Алишер')
        ->and($response->json('data.0.orders_count'))->toBe(2)
        ->and($response->json('data.0.orders_total'))->toBe(500000)
        ->and($response->json('data.0.roles'))->toBe(['client']);

    $get = fn (string $q) => $this->withToken($this->token)->getJson('/api/v1/admin/users?'.$q)->json('meta.total');

    expect($get('blocked=true'))->toBe(1)
        ->and($get('search='.urlencode('алиш')))->toBe(1)
        ->and($get('search=1112233'))->toBe(1)
        ->and($get('search=alisher@'))->toBe(1)
        ->and($get('role=admin'))->toBe(1);

    $this->withToken($this->token)->getJson('/api/v1/admin/users?role=manager')->assertUnprocessable();
});

it('is closed for clients', function () {
    $this->withToken(User::factory()->client()->create()->createToken('Pest')->plainTextToken)
        ->getJson('/api/v1/admin/users')
        ->assertForbidden();
});

it('shows a user with addresses and recent orders', function () {
    $client = User::factory()->client()->create();
    Address::factory()->for($client)->default()->create(['city' => 'Бухара']);
    $order = Order::factory()->for($client)->create();

    $this->withToken($this->token)->getJson("/api/v1/admin/users/{$client->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $client->id)
        ->assertJsonPath('data.orders_count', 1)
        ->assertJsonPath('data.addresses.0.city', 'Бухара')
        ->assertJsonPath('data.recent_orders.0.number', $order->number);

    $this->withToken($this->token)->getJson('/api/v1/admin/users/999999')->assertNotFound();
});

it('blocks and unblocks a user', function () {
    $client = User::factory()->client()->create(['password' => 'secret123']);
    $clientToken = $client->createToken('Phone')->plainTextToken;

    $this->withToken($this->token)->patchJson("/api/v1/admin/users/{$client->id}/block")
        ->assertOk()
        ->assertJsonPath('data.is_blocked', true);

    expect($client->tokens()->count())->toBe(0);

    $this->app['auth']->forgetGuards();
    $this->withToken($clientToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
    $this->postJson('/api/v1/auth/login', ['email' => $client->email, 'password' => 'secret123'])->assertForbidden();

    $this->app['auth']->forgetGuards();
    $this->withToken($this->token)->patchJson("/api/v1/admin/users/{$client->id}/unblock")
        ->assertOk()
        ->assertJsonPath('data.is_blocked', false);

    $this->postJson('/api/v1/auth/login', ['email' => $client->email, 'password' => 'secret123'])->assertOk();
});

it('does not block admins or yourself', function () {
    $otherAdmin = User::factory()->admin()->create();

    $this->withToken($this->token)->patchJson("/api/v1/admin/users/{$otherAdmin->id}/block")
        ->assertConflict()->assertJsonPath('code', 'CANNOT_MANAGE_USER');
    $this->withToken($this->token)->patchJson("/api/v1/admin/users/{$this->admin->id}/block")
        ->assertConflict();
});

it('has no role change endpoint: the shop has only clients and admins', function () {
    $client = User::factory()->client()->create();

    $this->withToken($this->token)->patchJson("/api/v1/admin/users/{$client->id}/role", ['role' => 'admin'])->assertNotFound();
});
