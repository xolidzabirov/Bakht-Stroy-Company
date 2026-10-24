<?php

declare(strict_types=1);

namespace App\Modules\Account\Providers;

use App\Shared\Providers\ModuleServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

final class AccountServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        // Password / email changes check the password: protect from guessing it with a stolen token.
        RateLimiter::for('sensitive', fn (Request $request) => Limit::perMinute(5)
            ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
