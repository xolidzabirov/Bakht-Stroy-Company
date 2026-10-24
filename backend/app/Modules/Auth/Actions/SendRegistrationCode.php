<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Notifications\RegistrationCodeNotification;
use App\Modules\Auth\Support\VerificationCodes;
use Illuminate\Support\Facades\Notification;

/**
 * Step 1 of registration: proves the person owns the email.
 */
final class SendRegistrationCode
{
    public function handle(string $email): void
    {
        $codes = VerificationCodes::emailOwnership();

        if (($wait = $codes->secondsUntilResend($email)) > 0) {
            throw new CodeRecentlySentException($wait);
        }

        Notification::route('mail', $email)
            ->notify(new RegistrationCodeNotification($codes->issue($email), VerificationCodes::ttlMinutes()));
    }
}
