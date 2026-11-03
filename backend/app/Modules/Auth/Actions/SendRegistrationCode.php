<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Exceptions\EmailNotDeliveredException;
use App\Modules\Auth\Notifications\RegistrationCodeNotification;
use App\Modules\Auth\Support\VerificationCodes;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

/**
 * Registration, email step: a 6-digit code to the address the account will use.
 * Sent right away, not through the queue: the person is waiting for it on the page.
 */
final class SendRegistrationCode
{
    /**
     * @return string the code
     *
     * @throws CodeRecentlySentException
     * @throws EmailNotDeliveredException
     */
    public function handle(string $email): string
    {
        $codes = VerificationCodes::emailOwnership();

        if (($wait = $codes->secondsUntilResend($email)) > 0) {
            throw new CodeRecentlySentException($wait);
        }

        $code = $codes->issue($email);

        try {
            Notification::route('mail', $email)->notifyNow(new RegistrationCodeNotification($code, VerificationCodes::ttlMinutes()));
        } catch (TransportExceptionInterface $exception) {
            // Nothing was sent — no pause before the next try.
            $codes->forget($email);
            Log::error('Registration code email failed: '.$exception->getMessage());

            throw new EmailNotDeliveredException;
        }

        return $code;
    }
}
