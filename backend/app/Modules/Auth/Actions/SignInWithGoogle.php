<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\Auth\Exceptions\GoogleSignInFailedException;
use App\Modules\Auth\Exceptions\StaffUsesPasswordException;
use App\Modules\User\Enums\Role;
use App\Modules\User\Exceptions\AccountBlockedException;
use App\Modules\User\Models\User;
use App\Shared\Exceptions\GoogleOAuthException;
use App\Shared\Support\GoogleOAuth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * "Войти через Google" for customers: signs in an existing account or creates one, with one click either way.
 *
 * The shop team signs in with a password only. A staff email may be an address nobody here owns
 * (the seeded admin@gmail.com is one): whoever holds it at Google must not get the panel.
 */
final class SignInWithGoogle
{
    public function __construct(private GoogleOAuth $google, private IssueToken $issueToken) {}

    /**
     * @throws GoogleSignInFailedException
     * @throws StaffUsesPasswordException
     * @throws AccountBlockedException
     */
    public function handle(string $code, string $redirectUri, string $deviceName): AuthResult
    {
        try {
            $profile = $this->google->profile($this->google->exchangeCode($code, $redirectUri)['access_token']);
        } catch (GoogleOAuthException $exception) {
            Log::warning('Google sign-in failed: '.$exception->getMessage());

            throw new GoogleSignInFailedException;
        }

        $googleId = (string) ($profile['sub'] ?? '');
        $email = mb_strtolower(trim((string) ($profile['email'] ?? '')));

        // Only an address Google has confirmed itself proves that this person owns it.
        if ($googleId === '' || $email === '' || ! filter_var($profile['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            throw new GoogleSignInFailedException;
        }

        return DB::transaction(function () use ($googleId, $email, $profile, $deviceName): AuthResult {
            $user = User::query()->where('google_id', $googleId)->lockForUpdate()->first()
                ?? User::query()->byEmail($email)->lockForUpdate()->first();

            $user = $user === null ? $this->createCustomer($googleId, $email, $profile) : $this->existing($user, $googleId);

            return $this->issueToken->handle($user, $deviceName);
        });
    }

    private function existing(User $user, string $googleId): User
    {
        if ($user->isStaff()) {
            throw new StaffUsesPasswordException;
        }

        if ($user->isBlocked()) {
            throw new AccountBlockedException;
        }

        // The same address under another Google account: Google gives old addresses to new people.
        if ($user->google_id !== null && $user->google_id !== $googleId) {
            throw new GoogleSignInFailedException;
        }

        if ($user->google_id === null) {
            $changes = ['google_id' => $googleId];

            // The address was never confirmed, so whoever made this account may not be its owner: their password ends here.
            if ($user->email_verified_at === null) {
                $changes += ['email_verified_at' => now(), 'password' => Str::password(40)];
                $user->tokens()->delete();
            }

            $user->forceFill($changes)->save();
        }

        return $user;
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private function createCustomer(string $googleId, string $email, array $profile): User
    {
        $name = trim((string) ($profile['name'] ?? ''));

        $user = User::query()->create([
            'name' => Str::limit(mb_strlen($name) >= 2 ? $name : Str::before($email, '@'), 100, ''),
            'email' => $email,
            // Not known to anyone: "Забыли пароль?" sets a real one if the person ever wants it.
            'password' => Str::password(40),
        ]);

        $user->forceFill(['google_id' => $googleId, 'email_verified_at' => now()])->save();
        $user->assignRole(Role::Client);

        return $user;
    }
}
