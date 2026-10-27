<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use App\Modules\Auth\Contracts\PhoneCodeSender;
use Illuminate\Support\Facades\Log;

/**
 * Local development without a Telegram Gateway token: the code is written to storage/logs.
 */
final class LogPhoneCodeSender implements PhoneCodeSender
{
    public function send(string $phone, string $code, int $ttlMinutes): PhoneCodeDelivery
    {
        Log::info("Telegram code for {$phone}: {$code} (valid {$ttlMinutes} min)");

        return PhoneCodeDelivery::delivered();
    }
}
