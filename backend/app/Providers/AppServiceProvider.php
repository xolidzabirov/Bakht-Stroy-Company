<?php

declare(strict_types=1);

namespace App\Providers;

use App\Shared\Contracts\FavoriteProducts;
use App\Shared\Contracts\ShopSettings;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Fallback when the Favorite module is not installed.
        $this->app->singletonIf(FavoriteProducts::class, fn () => new class implements FavoriteProducts
        {
            public function isFavorite(int $productId): bool
            {
                return false;
            }

            public function forget(int $userId): void {}
        });

        // Fallback when the Content module is not installed: delivery prices from .env.
        $this->app->singletonIf(ShopSettings::class, fn () => new class implements ShopSettings
        {
            public function get(string $group): array
            {
                return $group === 'delivery' ? (array) config('shop.delivery') : [];
            }
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        Password::defaults(fn () => Password::min(8)->letters()->numbers());

        // Swagger is always open locally; elsewhere only when API_DOCS_PUBLIC=true.
        Gate::define('viewApiDocs', fn (?Authenticatable $user = null): bool => (bool) config('scramble.public'));

        // Overall API limit: 120 requests per minute per user (or per IP for guests).
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute((int) config('shop.api_rate_limit'))
            ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
