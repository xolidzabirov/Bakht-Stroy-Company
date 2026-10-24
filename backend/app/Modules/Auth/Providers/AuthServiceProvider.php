<?php

declare(strict_types=1);

namespace App\Modules\Auth\Providers;

use App\Shared\Providers\ModuleServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

final class AuthServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        // Brute-force protection: 5 login attempts per minute for one email from one IP.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('register', fn (Request $request) => Limit::perHour(10)->by($request->ip()));

        // Emails with codes: at most 20 per hour from one IP (plus 1 per minute per email in the action).
        RateLimiter::for('register-code', fn (Request $request) => Limit::perHour(20)->by($request->ip()));

        RateLimiter::for('password-reset', fn (Request $request) => Limit::perMinute(3)
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));
    }
}
