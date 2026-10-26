<?php

declare(strict_types=1);

namespace App\Modules\Admin\Actions;

use App\Modules\Admin\Exceptions\CannotManageUserException;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Blocking and roles. Admins cannot be blocked or demoted, nobody can change themselves.
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

    /**
     * Client ↔ manager. New rights apply after the next login.
     */
    public function changeRole(User $user, Role $role, User $by): User
    {
        $this->ensureCanManage($user, $by);

        $user->syncRoles([$role]);
        $user->tokens()->delete();

        return $user->load('roles');
    }

    private function ensureCanManage(User $user, User $by): void
    {
        if ($user->is($by)) {
            throw new CannotManageUserException('Нельзя изменить собственный аккаунт таким способом.');
        }

        if ($user->hasRole(Role::Admin)) {
            throw new CannotManageUserException('Нельзя блокировать администратора или менять его роль.');
        }
    }
}
