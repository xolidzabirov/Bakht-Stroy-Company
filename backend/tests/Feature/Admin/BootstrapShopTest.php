<?php

use App\Modules\Catalog\Models\Category;
use App\Modules\User\Models\User;

/**
 * php artisan shop:bootstrap — first start on a server without a console.
 */
beforeEach(function () {
    config(['shop.admin' => ['name' => 'Админ', 'email' => 'boss@bakhtstroy.tj', 'phone' => null, 'password' => 'Strong123pass']]);
});

it('creates the admin and leaves a database with data untouched', function () {
    Category::factory()->create();

    $this->artisan('shop:bootstrap')->expectsOutputToContain('seeding skipped')->assertSuccessful();

    expect(User::query()->where('email', 'boss@bakhtstroy.tj')->sole()->hasRole('admin'))->toBeTrue()
        ->and(Category::query()->count())->toBe(1);
});

it('is safe to run on every start', function () {
    Category::factory()->create();

    $this->artisan('shop:bootstrap')->assertSuccessful();
    $this->artisan('shop:bootstrap')->assertSuccessful();

    expect(User::query()->where('email', 'boss@bakhtstroy.tj')->count())->toBe(1);
});
