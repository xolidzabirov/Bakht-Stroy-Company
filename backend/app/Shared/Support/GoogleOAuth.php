<?php

declare(strict_types=1);

namespace App\Shared\Support;

use App\Shared\Exceptions\GoogleOAuthException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Google OAuth 2.0: sign-in for customers and access to the shop's Gmail mailbox.
 * The client ID and secret come from the server's environment, the secret never leaves it.
 */
final class GoogleOAuth
{
    private const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const PROFILE_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

    private const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

    public function isConfigured(): bool
    {
        return filled(config('services.google.client_id')) && filled(config('services.google.client_secret'));
    }

    /**
     * @param  array<string, string>  $options
     */
    public function authorizationUrl(string $redirectUri, string $state, string $scope, array $options = []): string
    {
        return self::AUTHORIZE_URL.'?'.http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => $scope,
            'state' => $state,
            ...$options,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    /**
     * @return array{access_token: string, refresh_token?: string, scope?: string, expires_in?: int}
     *
     * @throws GoogleOAuthException
     */
    public function exchangeCode(string $code, string $redirectUri): array
    {
        return $this->tokens([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $redirectUri,
        ]);
    }

    /**
     * @return array{access_token: string, expires_in?: int}
     *
     * @throws GoogleOAuthException accessRevoked when the owner took the access back or changed the password
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        return $this->tokens([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
        ]);
    }

    /**
     * @return array<string, mixed> sub, email, email_verified, name
     *
     * @throws GoogleOAuthException
     */
    public function profile(string $accessToken): array
    {
        $response = $this->send(fn (): Response => Http::withToken($accessToken)->timeout(15)->get(self::PROFILE_URL));

        if ($response->failed()) {
            throw new GoogleOAuthException("Google profile request failed with status {$response->status()}.");
        }

        return (array) $response->json();
    }

    /**
     * Best effort: the access is forgotten on this side anyway.
     */
    public function revoke(string $token): void
    {
        rescue(fn () => Http::asForm()->timeout(10)->post(self::REVOKE_URL, ['token' => $token]), report: false);
    }

    /**
     * @param  array<string, string>  $fields
     * @return array{access_token: string, refresh_token?: string, scope?: string, expires_in?: int}
     */
    private function tokens(array $fields): array
    {
        $response = $this->send(fn (): Response => Http::asForm()->timeout(15)->post(self::TOKEN_URL, [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            ...$fields,
        ]));

        $accessToken = $response->json('access_token');

        if ($response->failed() || ! is_string($accessToken) || $accessToken === '') {
            $error = (string) $response->json('error', 'unknown');

            throw new GoogleOAuthException("Google token request failed: {$error}.", accessRevoked: $error === 'invalid_grant');
        }

        /** @var array{access_token: string, refresh_token?: string, scope?: string, expires_in?: int} */
        return (array) $response->json();
    }

    /**
     * @param  callable(): Response  $request
     */
    private function send(callable $request): Response
    {
        try {
            return $request();
        } catch (ConnectionException $exception) {
            throw new GoogleOAuthException('Google did not answer: '.$exception->getMessage());
        }
    }
}
