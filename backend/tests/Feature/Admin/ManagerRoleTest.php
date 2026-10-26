<?php

use App\Modules\Catalog\Models\Category;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->adminToken = $this->admin->createToken('Pest')->plainTextToken;
    $this->manager = User::factory()->manager()->create(['name' => 'Менеджер Фаррух']);
    $this->managerToken = $this->manager->createToken('Pest')->plainTextToken;
});

it('creates the three roles', function () {
    expect(Role::query()->pluck('name')->sort()->values()->all())
        ->toBe(['admin', 'client', 'manager']);
});

it('lets managers work with the shop', function (string $method, string $uri) {
    $order = Order::factory()->create();
    $category = Category::factory()->create();

    $uri = str_replace(['{order}', '{category}'], [$order->id, $category->id], $uri);

    $this->withToken($this->managerToken)->json($method, $uri)->assertSuccessful();
})->with([
    ['GET', '/api/v1/admin/stats'],
    ['GET', '/api/v1/admin/orders'],
    ['GET', '/api/v1/admin/orders/{order}'],
    ['GET', '/api/v1/admin/products'],
    ['GET', '/api/v1/admin/categories/{category}'],
    ['GET', '/api/v1/admin/news'],
    ['GET', '/api/v1/admin/banners'],
    ['GET', '/api/v1/admin/messages'],
    ['GET', '/api/v1/admin/users'],
    ['GET', '/api/v1/admin/settings'],
]);

it('lets managers change order statuses', function () {
    $order = Order::factory()->create();

    $this->withToken($this->managerToken)
        ->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertOk()
        ->assertJsonPath('data.history.0.author.name', 'Менеджер Фаррух');
});

it('keeps blocking, roles and store settings for admins only', function () {
    $client = User::factory()->client()->create();

    $this->withToken($this->managerToken)->patchJson("/api/v1/admin/users/{$client->id}/block")->assertForbidden();
    $this->withToken($this->managerToken)->patchJson("/api/v1/admin/users/{$client->id}/role", ['role' => 'manager'])->assertForbidden();
    $this->withToken($this->managerToken)->putJson('/api/v1/admin/settings', ['delivery' => ['price' => 1]])->assertForbidden();
});

it('lets the admin promote a client to manager and back', function () {
    $client = User::factory()->client()->create();
    $client->createToken('Phone');

    $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$client->id}/role", ['role' => 'manager'])
        ->assertOk()
        ->assertJsonPath('data.roles', ['manager'])
        ->assertJsonPath('data.is_staff', true);

    expect($client->tokens()->count())->toBe(0);

    $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$client->id}/role", ['role' => 'client'])
        ->assertOk()
        ->assertJsonPath('data.roles', ['client']);
});

it('does not make admins or change admins through the role endpoint', function () {
    $client = User::factory()->client()->create();
    $otherAdmin = User::factory()->admin()->create();

    $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$client->id}/role", ['role' => 'admin'])
        ->assertUnprocessable();
    $this->withToken($this->adminToken)->patchJson("/api/v1/admin/users/{$otherAdmin->id}/role", ['role' => 'client'])
        ->assertConflict()
        ->assertJsonPath('code', 'CANNOT_MANAGE_USER');
});

it('notifies managers about new orders too', function () {
    expect(User::query()->role(['admin', 'manager'])->count())->toBe(2);
});
