<?php

declare(strict_types=1);

namespace App\Modules\Content\Providers;

use App\Modules\Content\Support\DatabaseShopSettings;
use App\Shared\Contracts\ShopSettings;
use App\Shared\Providers\ModuleServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

final class ContentServiceProvider extends ModuleServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(DatabaseShopSettings::class);
        $this->app->singleton(ShopSettings::class, fn ($app) => $app->make(DatabaseShopSettings::class));
    }

    protected function bootModule(): void
    {
        RateLimiter::for('contact', fn (Request $request) => Limit::perHour(5)->by($request->ip()));
    }
}
