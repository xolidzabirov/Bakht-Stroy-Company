<?php

use App\Modules\Admin\Console\BootstrapShop;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * php artisan shop:bootstrap — first start on a server without a console.
 * (The seeders themselves are covered by their own runs; here the marker keeps them out.)
 */
beforeEach(function () {
    config(['shop.admin' => ['name' => 'Админ', 'email' => 'boss@bakhtstroy.tj', 'phone' => null, 'password' => 'Strong123pass']]);
});

it('creates the admin and skips the seeders once the database was seeded', function () {
    Cache::forever(BootstrapShop::DONE_MARKER, true);

    $this->artisan('shop:bootstrap')->expectsOutputToContain('already seeded')->assertSuccessful();

    expect(User::query()->where('email', 'boss@bakhtstroy.tj')->sole()->hasRole('admin'))->toBeTrue();
});

it('is safe to run on every start', function () {
    Cache::forever(BootstrapShop::DONE_MARKER, true);

    $this->artisan('shop:bootstrap')->assertSuccessful();
    $this->artisan('shop:bootstrap')->assertSuccessful();

    expect(User::query()->where('email', 'boss@bakhtstroy.tj')->count())->toBe(1);
});
