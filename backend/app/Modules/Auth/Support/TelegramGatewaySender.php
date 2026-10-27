<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use App\Modules\Auth\Contracts\PhoneCodeSender;
use App\Modules\Auth\Exceptions\PhoneNotOnTelegramException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Telegram Gateway API (https://core.telegram.org/gateway): sends the code as a message from the official
 * "Verification Codes" account to the Telegram of this phone number.
 * checkSendAbility first — it fails when the number has no Telegram, and the following send is not charged twice.
 */
final class TelegramGatewaySender implements PhoneCodeSender
{
    public function __construct(private readonly string $token, private readonly string $baseUrl) {}

    public function send(string $phone, string $code, int $ttlMinutes): PhoneCodeDelivery
    {
        $check = $this->call('checkSendAbility', ['phone_number' => $phone]);

        if (! ($check['ok'] ?? false)) {
            $error = (string) ($check['error'] ?? 'unknown error');
            Log::info('Telegram Gateway: cannot send to the number', ['phone' => $phone, 'error' => $error]);

            // Only number problems are the person's business; no money, a bad token etc. are ours.
            if (str_contains($error, 'PHONE_NUMBER')) {
                throw new PhoneNotOnTelegramException;
            }

            throw new RuntimeException('Telegram Gateway refused: '.$error);
        }

        $sent = $this->call('sendVerificationMessage', [
            'phone_number' => $phone,
            'request_id' => $check['result']['request_id'] ?? null,
            'code' => $code,
            'ttl' => max(30, min(3600, $ttlMinutes * 60)),
        ]);

        if (! ($sent['ok'] ?? false)) {
            throw new RuntimeException('Telegram Gateway did not send the code: '.($sent['error'] ?? 'unknown error'));
        }

        return PhoneCodeDelivery::delivered();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function call(string $method, array $payload): array
    {
        $response = Http::withToken($this->token)
            ->acceptJson()
            ->timeout(10)
            ->retry(2, 300, throw: false)
            ->post(rtrim($this->baseUrl, '/').'/'.$method, $payload);

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        return $json;
    }
}
