<?php

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;
use App\Shared\Contracts\FavoriteProducts;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

it('adds a request id and security headers to every response', function () {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Request-Id');

    $this->withHeader('X-Request-Id', 'abc-12345-xyz')->getJson('/api/v1/health')->assertHeader('X-Request-Id', 'abc-12345-xyz');
});

it('reports the state of database, cache and storage', function () {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertJsonPath('data.checks', ['database' => true, 'cache' => true, 'storage' => true])
        ->assertJsonPath('data.queue.failed_jobs', 0);
});

it('allows the frontend origin through CORS', function () {
    config(['cors.allowed_origins' => ['http://localhost:3000']]);

    $this->withHeaders(['Origin' => 'http://localhost:3000'])->getJson('/api/v1/health')
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
});

it('limits requests to the API per user', function () {
    config(['shop.api_rate_limit' => 3]);

    foreach (range(1, 3) as $i) {
        $this->getJson('/api/v1/health')->assertOk();
    }

    $this->getJson('/api/v1/health')->assertTooManyRequests();
});

it('does not run more queries for longer product lists (no N+1)', function () {
    $user = User::factory()->client()->create();
    $token = $user->createToken('Pest')->plainTextToken;
    $category = Category::factory()->create();

    $queriesFor = function (int $products) use ($token, $category, $user): int {
        Product::query()->delete();
        Product::factory()->for($category)->count($products)->create();

        // Same starting point for both runs: no cached user or favorites.
        $this->app['auth']->forgetGuards();
        app(FavoriteProducts::class)->forget($user->id);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->withToken($token)->getJson('/api/v1/products?per_page=60')->assertOk();
        // Sanctum updates last_used_at only on the first use of a token — not related to the list.
        $count = collect(DB::getQueryLog())->reject(fn (array $q) => str_contains($q['query'], 'personal_access_tokens'))->count();
        DB::disableQueryLog();

        return $count;
    };

    expect($queriesFor(20))->toBe($queriesFor(3));
});

it('caches the category tree in a real (serializing) cache store and drops it on changes', function () {
    // The array store keeps PHP objects as is; the file store serializes like database/redis do.
    config(['cache.default' => 'file']);
    Cache::flush();

    $category = Category::factory()->create(['name' => 'Старое имя']);

    $this->getJson('/api/v1/categories')->assertJsonPath('data.0.name', 'Старое имя');

    $category->update(['name' => 'Новое имя']);

    $this->getJson('/api/v1/categories')->assertJsonPath('data.0.name', 'Новое имя');
});

it('prunes expired verification codes', function () {
    DB::table('email_verification_codes')->insert(['email' => 'old@gmail.com', 'token' => 'x', 'attempts' => 0, 'created_at' => now()->subHour()]);
    DB::table('email_verification_codes')->insert(['email' => 'new@gmail.com', 'token' => 'x', 'attempts' => 0, 'created_at' => now()]);

    $this->artisan('shop:prune-codes')->assertSuccessful();

    expect(DB::table('email_verification_codes')->pluck('email')->all())->toBe(['new@gmail.com']);
});
