<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Support\RegistrationTicket;
use App\Modules\Auth\Support\VerificationCodes;

/**
 * Registration, code step: a right code from Telegram gives a pass for the last step (30 minutes).
 */
final class VerifyPhoneCode
{
    /**
     * @throws InvalidVerificationCodeException
     */
    public function handle(string $phone, string $code): string
    {
        $codes = VerificationCodes::phoneOwnership();

        if (! $codes->check($phone, $code)) {
            throw new InvalidVerificationCodeException;
        }

        $codes->forget($phone);

        return RegistrationTicket::issue($phone);
    }
}
