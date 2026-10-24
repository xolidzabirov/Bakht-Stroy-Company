<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Exceptions\InvalidResetCodeException;
use App\Modules\User\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Checks the reset code, sets the new password and signs the user out everywhere.
 */
final class ResetPassword
{
    public function handle(string $email, string $code, string $password): void
    {
        $user = User::query()->byEmail($email)->first();

        if ($user === null || $user->isBlocked()) {
            throw new InvalidResetCodeException;
        }

        $tokens = DB::table('password_reset_tokens')->where('email', $user->email);

        /** @var object{token: string, attempts: int, created_at: string}|null $row */
        $row = (clone $tokens)->first();

        $ttl = (int) config('shop.password_reset.code_ttl_minutes');
        $maxAttempts = (int) config('shop.password_reset.max_attempts');

        if ($row === null
            || Carbon::parse($row->created_at)->addMinutes($ttl)->isPast()
            || $row->attempts >= $maxAttempts) {
            throw new InvalidResetCodeException;
        }

        if (! Hash::check($code, $row->token)) {
            (clone $tokens)->increment('attempts');

            throw new InvalidResetCodeException;
        }

        DB::transaction(function () use ($user, $password, $tokens): void {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
            $tokens->delete();
        });
    }
}
