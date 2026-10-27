<?php

declare(strict_types=1);

namespace App\Modules\Auth\Contracts;

use App\Modules\Auth\Exceptions\PhoneNotOnTelegramException;

/**
 * Delivers a registration code to the phone number's Telegram account.
 */
interface PhoneCodeSender
{
    /**
     * @param  string  $phone  E.164, +992…
     *
     * @throws PhoneNotOnTelegramException when the number has no Telegram
     */
    public function send(string $phone, string $code, int $ttlMinutes): void;
}
