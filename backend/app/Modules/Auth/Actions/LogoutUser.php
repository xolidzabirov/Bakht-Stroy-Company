<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\User\Models\User;

final class LogoutUser
{
    /**
     * Revoke the token of the current request, or all tokens of the user.
     */
    public function handle(User $user, bool $allDevices = false): void
    {
        if ($allDevices) {
            $user->tokens()->delete();

            return;
        }

        // The API is token-only (sanctum.guard = []), so this is always a PersonalAccessToken.
        $user->currentAccessToken()->delete();
    }
}
