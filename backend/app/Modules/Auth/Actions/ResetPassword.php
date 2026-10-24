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
    public function handle(string $login, string $code, string $password): void
    {
        $user = User::query()->byLogin($login)->first();

        if ($user === null || $user->isBlocked()) {
            throw new InvalidResetCodeException;
        }

        $table = DB::table('password_reset_tokens');

        /** @var object{token: string, attempts: int, created_at: string}|null $row */
        $row = $table->where('login', $user->phone)->first();

        $ttl = (int) config('shop.password_reset.code_ttl_minutes');
        $maxAttempts = (int) config('shop.password_reset.max_attempts');

        if ($row === null
            || Carbon::parse($row->created_at)->addMinutes($ttl)->isPast()
            || $row->attempts >= $maxAttempts) {
            throw new InvalidResetCodeException;
        }

        if (! Hash::check($code, $row->token)) {
            $table->where('login', $user->phone)->increment('attempts');

            throw new InvalidResetCodeException;
        }

        DB::transaction(function () use ($user, $password): void {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();

            DB::table('password_reset_tokens')->where('login', $user->phone)->delete();
        });
    }
}
