<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Notifications\PasswordResetCodeNotification;
use App\Modules\Auth\Support\VerificationCodes;
use App\Modules\User\Models\User;

/**
 * Sends a 6-digit reset code to the user's email (and by SMS when a phone is set).
 * Silently does nothing for unknown or blocked accounts, so the API
 * does not reveal which emails are registered.
 */
final class SendPasswordResetCode
{
    public function handle(string $email): void
    {
        $user = User::query()->byEmail($email)->first();

        if ($user === null || $user->isBlocked()) {
            return;
        }

        $code = VerificationCodes::passwordReset()->issue($user->email);

        $user->notify(new PasswordResetCodeNotification($code, VerificationCodes::ttlMinutes()));
    }
}
