<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\Auth\Exceptions\InvalidRefreshTokenException;
use App\Modules\Auth\Support\SessionTokens;
use App\Modules\User\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Gives a session a new access token and a new refresh token, without a new login.
 *
 * Nobody may be thrown out by a network accident, so two things are allowed on purpose:
 *  - several requests with the same refresh token at once (open tabs, a page and its data) get the same new pair;
 *  - the previous refresh token keeps working until the newest one has been used:
 *    the answer with the new pair may never have reached the browser (a closed tab, a lost connection).
 * Anything older is refused, and so is a token whose session has ended (logout, block, password reset).
 */
final class RefreshSession
{
    public function __construct(private SessionTokens $tokens) {}

    public function handle(string $refreshToken): AuthResult
    {
        if (preg_match('/^(\d{1,18})\|(.+)$/D', $refreshToken, $parts) !== 1) {
            throw new InvalidRefreshTokenException;
        }

        [, $id, $secret] = $parts;
        $presented = hash('sha256', $secret);

        return DB::transaction(function () use ($id, $presented): AuthResult {
            // The row lock makes parallel requests wait for each other: the second one finds the pair of the first.
            /** @var PersonalAccessToken|null $session */
            $session = PersonalAccessToken::query()->whereKey($id)->lockForUpdate()->first();
            $user = $session?->tokenable;

            if ($session === null || ! $user instanceof User || $user->isBlocked() || ! $this->accepts($session, $presented)) {
                throw new InvalidRefreshTokenException;
            }

            $user->load('roles');
            $cacheKey = "auth:refresh:{$session->getKey()}:{$presented}";

            return $this->issuedJustNow($user, $cacheKey) ?? $this->rotate($session, $user, $presented, $cacheKey);
        });
    }

    private function accepts(PersonalAccessToken $session, string $presented): bool
    {
        $endsAt = $session->getAttribute('refresh_expires_at');

        if ($endsAt === null || Carbon::parse($endsAt)->isPast()) {
            return false;
        }

        return $this->matches($session->getAttribute('refresh_token'), $presented)
            || $this->matches($session->getAttribute('previous_refresh_token'), $presented);
    }

    private function matches(?string $known, string $presented): bool
    {
        return $known !== null && hash_equals($known, $presented);
    }

    private function issuedJustNow(User $user, string $cacheKey): ?AuthResult
    {
        $encrypted = Cache::get($cacheKey);

        if (! is_string($encrypted)) {
            return null;
        }

        /** @var array{token: string, expires_at: string, refresh_token: string, refresh_expires_at: string} $pair */
        $pair = json_decode(Crypt::decryptString($encrypted), true);

        return new AuthResult(
            $user,
            $pair['token'],
            Carbon::parse($pair['expires_at']),
            $pair['refresh_token'],
            Carbon::parse($pair['refresh_expires_at']),
        );
    }

    private function rotate(PersonalAccessToken $session, User $user, string $presented, string $cacheKey): AuthResult
    {
        $access = $user->generateTokenString();
        $refresh = $this->tokens->newRefreshToken($session);
        $expiresAt = $this->tokens->accessExpiry();
        $refreshExpiresAt = $this->tokens->refreshExpiry();
        // The newest token came back, so the browser has it: the one before it retires.
        $previous = $this->matches($session->getAttribute('refresh_token'), $presented)
            ? $presented
            : $session->getAttribute('previous_refresh_token');

        $session->forceFill([
            'token' => hash('sha256', $access),
            'expires_at' => $expiresAt,
            'refresh_token' => $refresh['hash'],
            'previous_refresh_token' => $previous,
            'refresh_expires_at' => $refreshExpiresAt,
            'last_used_at' => now(),
        ])->save();

        $accessToken = $session->getKey().'|'.$access;

        Cache::put($cacheKey, Crypt::encryptString((string) json_encode([
            'token' => $accessToken,
            'expires_at' => $expiresAt->toIso8601String(),
            'refresh_token' => $refresh['plain'],
            'refresh_expires_at' => $refreshExpiresAt->toIso8601String(),
        ])), (int) config('shop.auth.refresh_parallel_seconds'));

        return new AuthResult($user, $accessToken, $expiresAt, $refresh['plain'], $refreshExpiresAt);
    }
}
