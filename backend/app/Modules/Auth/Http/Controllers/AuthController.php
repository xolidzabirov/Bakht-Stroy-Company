<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\LoginUser;
use App\Modules\Auth\Actions\LogoutUser;
use App\Modules\Auth\Actions\RegisterUser;
use App\Modules\Auth\Exceptions\InvalidCredentialsException;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
use App\Modules\Auth\Http\Resources\AuthTokenResource;
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
     * Регистрация
     *
     * Создаёт аккаунт покупателя (роль client) и сразу возвращает токен.
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
