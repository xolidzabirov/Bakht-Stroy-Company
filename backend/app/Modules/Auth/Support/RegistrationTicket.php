<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

/**
 * "Pass" between the confirmed email and the last registration step: an encrypted note
 * "this email was confirmed, valid until …". Nobody can forge it without the APP_KEY.
 */
final class RegistrationTicket
{
    public const TTL_MINUTES = 30;

    private const PURPOSE = 'register';

    public static function issue(string $email): string
    {
        return Crypt::encryptString((string) json_encode([
            'purpose' => self::PURPOSE,
            'email' => $email,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES)->getTimestamp(),
        ]));
    }

    /**
     * The confirmed email, or null when the ticket is broken, forged or expired.
     */
    public static function email(string $ticket): ?string
    {
        try {
            /** @var array{purpose?: string, email?: string, expires_at?: int}|null $data */
            $data = json_decode(Crypt::decryptString($ticket), true);
        } catch (DecryptException) {
            return null;
        }

        if (! is_array($data) || ($data['purpose'] ?? null) !== self::PURPOSE || ($data['expires_at'] ?? 0) < now()->getTimestamp()) {
            return null;
        }

        return is_string($data['email'] ?? null) ? $data['email'] : null;
    }
}
