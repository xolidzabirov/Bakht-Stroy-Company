<?php

use App\Modules\User\Database\Seeders\AdminSeeder;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['api', 'auth:sanctum', 'active', 'role:admin|manager'])
        ->get('/api/v1/_test/staff', fn () => ['ok' => true]);
});

it('creates the default roles in a migration', function () {
    expect(Spatie\Permission\Models\Role::query()->pluck('name')->sort()->values()->all())
        ->toBe(['admin', 'client', 'manager']);
});

it('lets admins and managers into staff routes', function (string $state) {
    $user = User::factory()->{$state}()->create();

    $this->withToken($user->createToken('Pest')->plainTextToken)
        ->getJson('/api/v1/_test/staff')
        ->assertOk();
})->with(['admin', 'manager']);

it('forbids clients from staff routes', function () {
    $user = User::factory()->client()->create();

    $this->withToken($user->createToken('Pest')->plainTextToken)
        ->getJson('/api/v1/_test/staff')
        ->assertForbidden()
        ->assertExactJson(['message' => 'Недостаточно прав.', 'code' => 'FORBIDDEN']);
});

it('seeds the single admin from config', function () {
    config(['shop.admin' => [
        'name' => 'Админ',
        'email' => 'Admin@Gmail.com',
        'password' => 'Admin12345',
    ]]);

    $this->seed(AdminSeeder::class);
    $this->seed(AdminSeeder::class); // idempotent

    $admin = User::query()->sole();

    expect($admin->email)->toBe('admin@gmail.com')
        ->and($admin->hasRole(Role::Admin))->toBeTrue()
        ->and(Hash::check('Admin12345', $admin->password))->toBeTrue();

    $this->postJson('/api/v1/auth/login', ['email' => 'admin@gmail.com', 'password' => 'Admin12345'])
        ->assertOk()
        ->assertJsonPath('data.user.roles', ['admin']);
});

it('skips the admin seeder without credentials', function () {
    config(['shop.admin.email' => null, 'shop.admin.password' => null]);

    $this->seed(AdminSeeder::class);

    expect(User::query()->count())->toBe(0);
});
