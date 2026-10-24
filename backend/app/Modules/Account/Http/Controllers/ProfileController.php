<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Controllers;

use App\Modules\Account\Actions\ChangeEmail;
use App\Modules\Account\Actions\ChangePassword;
use App\Modules\Account\Actions\DeleteAccount;
use App\Modules\Account\Actions\GetDashboard;
use App\Modules\Account\Exceptions\AccountHasActiveOrdersException;
use App\Modules\Account\Http\Requests\ChangeEmailRequest;
use App\Modules\Account\Http\Requests\ChangePasswordRequest;
use App\Modules\Account\Http\Requests\DeleteAccountRequest;
use App\Modules\Account\Http\Requests\SendEmailChangeCodeRequest;
use App\Modules\Account\Http\Requests\UpdateProfileRequest;
use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Support\VerificationCodes;
use App\Modules\User\Http\Resources\UserResource;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

#[Group('Личный кабинет', weight: 6)]
final class ProfileController extends Controller
{
    /**
     * Обзор кабинета
     *
     * Профиль, счётчики заказов, сумма покупок, последний заказ, избранное, корзина, непрочитанные уведомления.
     */
    public function dashboard(#[CurrentUser] User $user, GetDashboard $dashboard): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => UserResource::make($user->load('roles')),
                ...$dashboard->handle($user),
            ],
        ]);
    }

    /**
     * Изменить профиль
     *
     * Можно передать только изменённые поля: имя, телефон, язык (ru, uz), тему (light, dark, system).
     */
    public function update(UpdateProfileRequest $request, #[CurrentUser] User $user): UserResource
    {
        $user->update($request->changes());

        return UserResource::make($user->load('roles'));
    }

    /**
     * Сменить пароль
     *
     * Нужен текущий пароль. Все другие устройства выходят из аккаунта, текущее остаётся.
     */
    public function changePassword(ChangePasswordRequest $request, #[CurrentUser] User $user, ChangePassword $changePassword): JsonResponse
    {
        $changePassword->handle(
            $user,
            $request->string('current_password')->toString(),
            $request->string('password')->toString(),
        );

        return response()->json(['data' => [
            /** @example Пароль изменён. Другие устройства вышли из аккаунта. */
            'message' => 'Пароль изменён. Другие устройства вышли из аккаунта.',
        ]]);
    }

    /**
     * Сменить email, шаг 1 — код на новый email
     *
     * @throws CodeRecentlySentException
     */
    public function sendEmailCode(SendEmailChangeCodeRequest $request, ChangeEmail $changeEmail): JsonResponse
    {
        $changeEmail->sendCode($request->string('email')->toString());

        return response()->json(['data' => [
            /** @example Код отправлен на новый email. */
            'message' => 'Код отправлен на новый email.',
            /** @example 15 */
            'expires_in_minutes' => VerificationCodes::ttlMinutes(),
        ]], 202);
    }

    /**
     * Сменить email, шаг 2 — подтвердить
     *
     * Новый email, код из письма и текущий пароль. После смены вход — по новому email.
     *
     * @throws InvalidVerificationCodeException
     */
    public function changeEmail(ChangeEmailRequest $request, #[CurrentUser] User $user, ChangeEmail $changeEmail): UserResource
    {
        $user = $changeEmail->confirm(
            $user,
            $request->string('email')->toString(),
            $request->string('code')->toString(),
            $request->string('password')->toString(),
        );

        return UserResource::make($user->load('roles'));
    }

    /**
     * Удалить аккаунт
     *
     * Нужен пароль. Нельзя, пока есть незавершённые заказы. Email и телефон освобождаются,
     * адреса, корзина и избранное удаляются, история заказов сохраняется.
     *
     * @throws AccountHasActiveOrdersException
     */
    public function destroy(DeleteAccountRequest $request, #[CurrentUser] User $user, DeleteAccount $deleteAccount): Response
    {
        $deleteAccount->handle($user, $request->string('password')->toString());

        return response()->noContent();
    }
}
