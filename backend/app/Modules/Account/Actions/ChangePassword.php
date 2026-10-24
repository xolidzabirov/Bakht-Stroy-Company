<?php

declare(strict_types=1);

namespace App\Modules\Account\Actions;

use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Sets a new password and signs out all other devices (the current one stays logged in).
 */
final class ChangePassword
{
    public function handle(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Неверный текущий пароль.']);
        }

        DB::transaction(function () use ($user, $newPassword): void {
            $user->forceFill(['password' => $newPassword])->save();

            $user->tokens()->whereKeyNot($user->currentAccessToken()->getKey())->delete();
        });
    }
}
