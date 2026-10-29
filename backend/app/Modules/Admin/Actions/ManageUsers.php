<?php

declare(strict_types=1);

namespace App\Modules\Admin\Actions;

use App\Modules\Admin\Exceptions\CannotManageUserException;
use App\Modules\Admin\Support\PasswordGenerator;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Accounts made by the admin, blocking, roles and new passwords.
 * Admins cannot be blocked, demoted or have their password reset here; nobody can change themselves.
 */
final class ManageUsers
{
    /**
     * A ready-to-use account (e.g. a new manager): email confirmed, the role set.
     * Without a password from the admin a strong one is generated. The plain password is returned
     * only here, once, for the admin to hand over — the database keeps just its hash.
     *
     * @param  array{name: string, email: string, phone: string|null, role: Role, password: string|null}  $data
     * @return array{user: User, password: string}
     */
    public function create(array $data): array
    {
        $password = $data['password'] ?? PasswordGenerator::make();

        $user = DB::transaction(function () use ($data, $password): User {
            $user = new User;
            $user->forceFill([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'password' => $password,
                'email_verified_at' => now(),
            ])->save();
            $user->syncRoles([$data['role']]);

            return $user;
        });

        return ['user' => $user->load('roles'), 'password' => $password];
    }

    /**
     * A new generated password, e.g. when a manager forgot theirs. Signs the person out everywhere.
     */
    public function resetPassword(User $user, User $by): string
    {
        $this->ensureCanManage($user, $by);

        $password = PasswordGenerator::make();

        DB::transaction(function () use ($user, $password): void {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
        });

        return $password;
    }

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
            throw new CannotManageUserException('Аккаунт администратора нельзя заблокировать, сменить ему роль или пароль.');
        }
    }
}
