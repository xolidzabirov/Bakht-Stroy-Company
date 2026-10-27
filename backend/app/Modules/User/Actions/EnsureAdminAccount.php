<?php

declare(strict_types=1);

namespace App\Modules\User\Actions;

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use App\Shared\Support\Phone;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * The main administrator from .env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD).
 * Safe to run again: the account is found by email and updated.
 * Without ADMIN_PASSWORD an existing admin keeps the current password (forgot it → put a new one in .env and run again).
 * The password is never printed or logged.
 */
final class EnsureAdminAccount
{
    /**
     * @param  array{name?: string|null, email?: string|null, phone?: string|null, password?: string|null}  $data
     * @return array{user: User, created: bool, password_changed: bool}
     */
    public function handle(array $data): array
    {
        $email = mb_strtolower(trim((string) ($data['email'] ?? '')));
        $password = trim((string) ($data['password'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));

        $validator = Validator::make(
            ['email' => $email, 'password' => $password === '' ? null : $password, 'phone' => $phone === '' ? null : $phone],
            ['email' => ['required', 'email'], 'password' => ['nullable', Password::defaults()], 'phone' => ['nullable', 'string']],
            [],
            ['email' => 'ADMIN_EMAIL', 'password' => 'ADMIN_PASSWORD', 'phone' => 'ADMIN_PHONE'],
        );
        $validator->validate();

        $normalizedPhone = $phone === '' ? null : Phone::normalize($phone);

        if ($normalizedPhone !== null && ! Phone::isValid($normalizedPhone)) {
            throw ValidationException::withMessages(['phone' => 'ADMIN_PHONE: номер вида +992XXXXXXXXX.']);
        }

        $user = User::query()->withTrashed()->byEmail($email)->first();

        if ($user === null && $password === '') {
            throw ValidationException::withMessages(['password' => 'ADMIN_PASSWORD нужен, чтобы создать администратора.']);
        }

        $phoneTaken = $normalizedPhone !== null && User::query()->where('phone', $normalizedPhone)
            ->when($user, fn ($query) => $query->whereKeyNot($user->id))->exists();

        if ($phoneTaken) {
            throw ValidationException::withMessages(['phone' => 'ADMIN_PHONE уже занят другим пользователем.']);
        }

        $created = $user === null;
        $user ??= new User;

        if ($user->trashed()) {
            $user->restore();
        }

        $user->forceFill(array_filter([
            'name' => trim((string) ($data['name'] ?? '')) ?: ($user->name ?? 'Администратор'),
            'email' => $email,
            'phone' => $normalizedPhone ?? $user->phone,
            'password' => $password === '' ? null : $password,
            'email_verified_at' => $user->email_verified_at ?? now(),
            'blocked_at' => null,
        ], fn ($value, $key) => $value !== null || $key === 'blocked_at', ARRAY_FILTER_USE_BOTH))->save();

        $user->syncRoles([Role::Admin]);

        return ['user' => $user, 'created' => $created, 'password_changed' => $password !== ''];
    }
}
