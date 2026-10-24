<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\User\Models\User;

/**
 * Creates a Sanctum token named after the client device ("Chrome", "iPhone 15").
 */
final class IssueToken
{
    public function handle(User $user, string $deviceName): AuthResult
    {
        $minutes = config('sanctum.expiration');
        $expiresAt = $minutes ? now()->addMinutes((int) $minutes) : null;

        $token = $user->createToken($deviceName, ['*'], $expiresAt);

        return new AuthResult($user->load('roles'), $token->plainTextToken, $expiresAt);
    }
}
