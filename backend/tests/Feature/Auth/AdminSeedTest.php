<?php

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * php artisan admin:seed — the main administrator from .env, safe to run again.
 */
beforeEach(function () {
    config(['shop.admin' => ['name' => 'Админ Бахт', 'email' => 'Boss@Bakhtstroy.tj', 'phone' => '90 766 66 09', 'password' => 'Strong123pass']]);
});

it('creates the admin with the role, normalized email and phone', function () {
    $this->artisan('admin:seed')->expectsOutputToContain('создан')->assertSuccessful();

    $admin = User::query()->where('email', 'boss@bakhtstroy.tj')->firstOrFail();

    expect($admin->hasRole(Role::Admin))->toBeTrue()
        ->and($admin->phone)->toBe('+992907666609')
        ->and($admin->email_verified_at)->not->toBeNull()
        ->and(Hash::check('Strong123pass', $admin->password))->toBeTrue();
});

it('updates the same account on a second run and keeps the password when none is given', function () {
    $this->artisan('admin:seed')->assertSuccessful();
    config(['shop.admin.password' => null, 'shop.admin.name' => 'Новое имя']);

    $this->artisan('admin:seed')->expectsOutputToContain('обновлён')->assertSuccessful();

    $admin = User::query()->where('email', 'boss@bakhtstroy.tj')->sole();
    expect($admin->name)->toBe('Новое имя')
        ->and(Hash::check('Strong123pass', $admin->password))->toBeTrue();
});

it('restores a blocked admin and resets the password from .env', function () {
    $this->artisan('admin:seed')->assertSuccessful();
    User::query()->where('email', 'boss@bakhtstroy.tj')->update(['blocked_at' => now()]);
    config(['shop.admin.password' => 'Another456pass']);

    $this->artisan('admin:seed')->assertSuccessful();

    $admin = User::query()->where('email', 'boss@bakhtstroy.tj')->sole();
    expect($admin->blocked_at)->toBeNull()->and(Hash::check('Another456pass', $admin->password))->toBeTrue();
});

it('refuses weak passwords and a missing password for a new admin', function () {
    config(['shop.admin.password' => '123']);
    $this->artisan('admin:seed')->assertFailed();

    config(['shop.admin.password' => null]);
    $this->artisan('admin:seed')->expectsOutputToContain('ADMIN_PASSWORD')->assertFailed();

    expect(User::query()->where('email', 'boss@bakhtstroy.tj')->exists())->toBeFalse();
});

it('never prints the password', function () {
    $this->artisan('admin:seed')->doesntExpectOutputToContain('Strong123pass')->assertSuccessful();
});
