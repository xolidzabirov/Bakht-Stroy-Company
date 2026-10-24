<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Notifications\PasswordResetCodeNotification;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Sends a 6-digit reset code by SMS (and email when the user has one).
 * Silently does nothing for unknown or blocked accounts, so the API
 * does not reveal which phones are registered.
 */
final class SendPasswordResetCode
{
    public function handle(string $login): void
    {
        $user = User::query()->byLogin($login)->first();

        if ($user === null || $user->isBlocked()) {
            return;
        }

        $code = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->upsert(
            ['login' => $user->phone, 'token' => Hash::make($code), 'attempts' => 0, 'created_at' => now()],
            ['login'],
            ['token', 'attempts', 'created_at'],
        );

        $user->notify(new PasswordResetCodeNotification($code, (int) config('shop.password_reset.code_ttl_minutes')));
    }
}
