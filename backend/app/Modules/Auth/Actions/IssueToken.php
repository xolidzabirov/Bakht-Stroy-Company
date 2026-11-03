<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\Auth\Support\SessionTokens;
use App\Modules\User\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Starts a session: a Sanctum token named after the client device ("Chrome", "iPhone 15") and its refresh token.
 */
final class IssueToken
{
    public function __construct(private SessionTokens $tokens) {}

    public function handle(User $user, string $deviceName): AuthResult
    {
        $expiresAt = $this->tokens->accessExpiry();
        $refreshExpiresAt = $this->tokens->refreshExpiry();

        $token = $user->createToken($deviceName, ['*'], $expiresAt);

        /** @var PersonalAccessToken $session */
        $session = $token->accessToken;
        $refresh = $this->tokens->newRefreshToken($session);

        $session->forceFill(['refresh_token' => $refresh['hash'], 'refresh_expires_at' => $refreshExpiresAt])->save();

        return new AuthResult($user->load('roles'), $token->plainTextToken, $expiresAt, $refresh['plain'], $refreshExpiresAt);
    }
}
