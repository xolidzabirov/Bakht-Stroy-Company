<?php

declare(strict_types=1);

namespace App\Modules\Content\Support;

use App\Shared\Exceptions\GoogleOAuthException;
use App\Shared\Support\GoogleOAuth;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

/**
 * The shop's Gmail mailbox that sends the letters: connected once by the administrator, in the admin panel.
 * Kept in the settings table outside the public groups, with the refresh token encrypted.
 */
final class GmailConnection
{
    private const GROUP = 'gmail';

    private const ACCESS_TOKEN_KEY = 'gmail:access-token';

    public function __construct(private DatabaseShopSettings $settings, private GoogleOAuth $google) {}

    public function isConnected(): bool
    {
        return $this->refreshToken() !== null;
    }

    public function email(): ?string
    {
        return $this->settings->get(self::GROUP)['email'] ?? null;
    }

    /** Google took the access back (for example, the Gmail password was changed): it has to be connected again. */
    public function isBroken(): bool
    {
        return (bool) ($this->settings->get(self::GROUP)['broken'] ?? false);
    }

    /** The name people see next to the address in the letter. */
    public function senderName(): string
    {
        return (string) ($this->settings->get('store')['name'] ?? config('app.name'));
    }

    public function save(string $email, string $refreshToken): void
    {
        $this->settings->update(self::GROUP, ['email' => $email, 'refresh_token' => Crypt::encryptString($refreshToken), 'broken' => false]);
        $this->forgetAccessToken();
    }

    public function forget(): void
    {
        $refreshToken = $this->refreshToken();

        $this->settings->update(self::GROUP, ['email' => null, 'refresh_token' => null, 'broken' => false]);
        $this->forgetAccessToken();

        if ($refreshToken !== null) {
            $this->google->revoke($refreshToken);
        }
    }

    /**
     * A token for the Gmail API, kept until shortly before it ends.
     *
     * @throws GoogleOAuthException
     */
    public function accessToken(): string
    {
        $refreshToken = $this->refreshToken() ?? throw new GoogleOAuthException('Gmail is not connected.');
        $kept = Cache::get(self::ACCESS_TOKEN_KEY);

        if (is_string($kept) && ($token = $this->decrypt($kept)) !== null) {
            return $token;
        }

        try {
            $tokens = $this->google->refreshAccessToken($refreshToken);
        } catch (GoogleOAuthException $exception) {
            if ($exception->accessRevoked) {
                $this->settings->update(self::GROUP, ['broken' => true]);
            }

            throw $exception;
        }

        Cache::put(self::ACCESS_TOKEN_KEY, Crypt::encryptString($tokens['access_token']), max(60, (int) ($tokens['expires_in'] ?? 3600) - 120));

        return $tokens['access_token'];
    }

    public function forgetAccessToken(): void
    {
        Cache::forget(self::ACCESS_TOKEN_KEY);
    }

    private function refreshToken(): ?string
    {
        $encrypted = $this->settings->get(self::GROUP)['refresh_token'] ?? null;

        return is_string($encrypted) ? $this->decrypt($encrypted) : null;
    }

    private function decrypt(string $value): ?string
    {
        try {
            return Crypt::decryptString($value);
        } catch (DecryptException) {
            return null;
        }
    }
}
