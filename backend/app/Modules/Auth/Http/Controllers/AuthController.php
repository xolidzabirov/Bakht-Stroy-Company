<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\LoginUser;
use App\Modules\Auth\Actions\LogoutUser;
use App\Modules\Auth\Actions\RegisterUser;
use App\Modules\Auth\Actions\SendRegistrationCode;
use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Exceptions\InvalidCredentialsException;
use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
use App\Modules\Auth\Http\Requests\SendRegistrationCodeRequest;
use App\Modules\Auth\Http\Resources\AuthTokenResource;
use App\Modules\Auth\Support\VerificationCodes;
use App\Modules\User\Exceptions\AccountBlockedException;
use App\Modules\User\Http\Resources\UserResource;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

#[Group('Авторизация', weight: 1)]
final class AuthController extends Controller
{
    /**
     * Регистрация, шаг 1 — код на email
     *
     * Проверяет, что email свободен и существует (у домена есть почтовый сервер), и отправляет
     * на него 6-значный код. Повторно — не чаще раза в минуту. Локально письма пишутся
     * в storage/logs/laravel-<дата>.log.
     *
     * @throws CodeRecentlySentException
     */
    public function sendRegistrationCode(SendRegistrationCodeRequest $request, SendRegistrationCode $sendCode): JsonResponse
    {
        $sendCode->handle($request->string('email')->toString());

        return response()->json([
            'data' => [
                /** @example Код отправлен на email. */
                'message' => 'Код отправлен на email.',
                /** @example 15 */
                'expires_in_minutes' => VerificationCodes::ttlMinutes(),
            ],
        ], 202);
    }

    /**
     * Регистрация, шаг 2 — создать аккаунт
     *
     * Создаёт аккаунт покупателя (роль client) с кодом из письма, email считается подтверждённым.
     * Сразу возвращает токен.
     *
     * @throws InvalidVerificationCodeException
     */
    public function register(RegisterRequest $request, RegisterUser $registerUser): JsonResponse
    {
        return AuthTokenResource::make($registerUser->handle($request->toData()))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Вход
     *
     * Вход по email и паролю. Не больше 5 попыток в минуту.
     *
     * @throws InvalidCredentialsException
     * @throws AccountBlockedException
     */
    public function login(LoginRequest $request, LoginUser $loginUser): AuthTokenResource
    {
        return AuthTokenResource::make($loginUser->handle($request->toData()));
    }

    /**
     * Текущий пользователь
     */
    public function me(#[CurrentUser] User $user): UserResource
    {
        return UserResource::make($user->load('roles'));
    }

    /**
     * Выход
     *
     * Удаляет токен текущего устройства.
     */
    public function logout(#[CurrentUser] User $user, LogoutUser $logoutUser): Response
    {
        $logoutUser->handle($user);

        return response()->noContent();
    }

    /**
     * Выход со всех устройств
     *
     * Удаляет все токены пользователя.
     */
    public function logoutAll(#[CurrentUser] User $user, LogoutUser $logoutUser): Response
    {
        $logoutUser->handle($user, allDevices: true);

        return response()->noContent();
    }
}
