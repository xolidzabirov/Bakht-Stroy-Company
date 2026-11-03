<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Lifetimes and the refresh token of a session (one personal_access_tokens row).
 * The database keeps only the hash of a refresh token, like Sanctum does for the access token.
 */
final class SessionTokens
{
    public function accessExpiry(): Carbon
    {
        return now()->addMinutes((int) config('shop.auth.token_ttl_minutes'));
    }

    public function refreshExpiry(): Carbon
    {
        return now()->addDays((int) config('shop.auth.refresh_ttl_days'));
    }

    /**
     * @return array{plain: string, hash: string} plain goes to the client as "{session id}|{secret}"
     */
    public function newRefreshToken(PersonalAccessToken $session): array
    {
        $secret = Str::random(64);

        return ['plain' => $session->getKey().'|'.$secret, 'hash' => hash('sha256', $secret)];
    }
}
