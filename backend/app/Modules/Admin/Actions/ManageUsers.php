<?php

declare(strict_types=1);

namespace App\Modules\Admin\Actions;

use App\Modules\Admin\Exceptions\CannotManageUserException;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Blocking clients. Admins cannot be blocked, nobody can block themselves.
 */
final class ManageUsers
{
    public function block(User $user, User $by): User
    {
        $this->ensureCanManage($user, $by);

        DB::transaction(function () use ($user): void {
            $user->forceFill(['blocked_at' => now()])->save();
            $user->tokens()->delete();
        });

        return $user;
    }

    public function unblock(User $user, User $by): User
    {
        $this->ensureCanManage($user, $by);

        $user->forceFill(['blocked_at' => null])->save();

        return $user;
    }

    private function ensureCanManage(User $user, User $by): void
    {
        if ($user->is($by)) {
            throw new CannotManageUserException('Нельзя заблокировать собственный аккаунт.');
        }

        if ($user->hasRole(Role::Admin)) {
            throw new CannotManageUserException('Нельзя заблокировать администратора.');
        }
    }
}
