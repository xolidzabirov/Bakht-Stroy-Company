<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Exceptions\InvalidResetCodeException;
use App\Modules\Auth\Support\VerificationCodes;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Checks the reset code, sets the new password and signs the user out everywhere.
 */
final class ResetPassword
{
    public function handle(string $email, string $code, string $password): void
    {
        $user = User::query()->byEmail($email)->first();
        $codes = VerificationCodes::passwordReset();

        if ($user === null || $user->isBlocked() || ! $codes->check($user->email, $code)) {
            throw new InvalidResetCodeException;
        }

        DB::transaction(function () use ($user, $password, $codes): void {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
            $codes->forget($user->email);
        });
    }
}
