<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Support\RegistrationTicket;
use App\Modules\Auth\Support\VerificationCodes;

/**
 * Registration, code step: the right code from the email gives a pass for the last step (30 minutes).
 */
final class VerifyRegistrationCode
{
    /**
     * @throws InvalidVerificationCodeException
     */
    public function handle(string $email, string $code): string
    {
        $codes = VerificationCodes::emailOwnership();

        if (! $codes->check($email, $code)) {
            throw new InvalidVerificationCodeException;
        }

        $codes->forget($email);

        return RegistrationTicket::issue($email);
    }
}
