<?php

declare(strict_types=1);

namespace App\Modules\Auth\Providers;

use App\Modules\Auth\Contracts\PhoneCodeSender;
use App\Modules\Auth\Support\LogPhoneCodeSender;
use App\Modules\Auth\Support\TelegramGatewaySender;
use App\Shared\Providers\ModuleServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

final class AuthServiceProvider extends ModuleServiceProvider
{
    public function register(): void
    {
        // Registration codes go to Telegram; without a gateway token (development) — to the log.
        $this->app->bind(PhoneCodeSender::class, function () {
            $config = config('services.telegram_gateway');

            return ($config['driver'] ?? 'log') === 'gateway' && ! empty($config['token'])
                ? new TelegramGatewaySender((string) $config['token'], (string) $config['url'])
                : new LogPhoneCodeSender;
        });
    }

    protected function bootModule(): void
    {
        // Brute-force protection: 5 login attempts per minute for one email from one IP.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('register', fn (Request $request) => Limit::perHour(10)->by($request->ip()));

        // Telegram codes cost money: at most 10 per hour from one IP and 5 per hour for one number
        // (plus 1 per minute per number in the action).
        RateLimiter::for('register-code', fn (Request $request) => [
            Limit::perHour(10)->by($request->ip()),
            Limit::perHour(5)->by('phone|'.preg_replace('/\D+/', '', (string) $request->input('phone'))),
        ]);

        // Checking a code: 10 tries per 10 minutes per IP (each code allows only a few wrong tries anyway).
        RateLimiter::for('register-verify', fn (Request $request) => Limit::perMinutes(10, 10)->by($request->ip()));

        // Email codes for the email change in the account.
        RateLimiter::for('email-code', fn (Request $request) => Limit::perHour(20)->by($request->ip()));

        RateLimiter::for('password-reset', fn (Request $request) => Limit::perMinute(3)
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));
    }
}
