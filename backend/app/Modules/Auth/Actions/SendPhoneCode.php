<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Contracts\PhoneCodeSender;
use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Exceptions\PhoneNotOnTelegramException;
use App\Modules\Auth\Support\PhoneCodeDelivery;
use App\Modules\Auth\Support\VerificationCodes;

/**
 * Registration, phone step: a 6-digit code to the Telegram of this number.
 */
final class SendPhoneCode
{
    public function __construct(private readonly PhoneCodeSender $sender) {}

    /**
     * @throws CodeRecentlySentException
     * @throws PhoneNotOnTelegramException
     */
    public function handle(string $phone): PhoneCodeDelivery
    {
        $codes = VerificationCodes::phoneOwnership();

        if (($wait = $codes->secondsUntilResend($phone)) > 0) {
            throw new CodeRecentlySentException($wait);
        }

        $code = $codes->issue($phone);

        try {
            return $this->sender->send($phone, $code, VerificationCodes::ttlMinutes());
        } catch (PhoneNotOnTelegramException $exception) {
            // Nothing was sent — let the person fix the number right away, without the resend pause.
            $codes->forget($phone);

            throw $exception;
        }
    }
}
