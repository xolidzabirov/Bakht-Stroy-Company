<?php

declare(strict_types=1);

namespace App\Modules\Account\Actions;

use App\Modules\Account\Notifications\EmailChangeCodeNotification;
use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Support\VerificationCodes;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

/**
 * Email change: a code goes to the NEW address, the change needs the code and the password.
 */
final class ChangeEmail
{
    public function sendCode(string $newEmail): void
    {
        $codes = VerificationCodes::emailOwnership();

        if (($wait = $codes->secondsUntilResend($newEmail)) > 0) {
            throw new CodeRecentlySentException($wait);
        }

        Notification::route('mail', $newEmail)
            ->notify(new EmailChangeCodeNotification($codes->issue($newEmail), VerificationCodes::ttlMinutes()));
    }

    public function confirm(User $user, string $newEmail, string $code, string $password): User
    {
        if (! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages(['password' => 'Неверный пароль.']);
        }

        $codes = VerificationCodes::emailOwnership();

        if (! $codes->check($newEmail, $code)) {
            throw new InvalidVerificationCodeException;
        }

        DB::transaction(function () use ($user, $newEmail, $codes): void {
            $user->forceFill(['email' => $newEmail, 'email_verified_at' => now()])->save();
            $codes->forget($newEmail);
        });

        return $user;
    }
}
