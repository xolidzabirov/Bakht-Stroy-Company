<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\LoginUser;
use App\Modules\Auth\Actions\LogoutUser;
use App\Modules\Auth\Actions\RegisterUser;
use App\Modules\Auth\Actions\SendRegistrationCode;
use App\Modules\Auth\Actions\VerifyRegistrationCode;
use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Exceptions\EmailNotDeliveredException;
use App\Modules\Auth\Exceptions\InvalidCredentialsException;
use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Exceptions\RegistrationExpiredException;
use App\Modules\Auth\Http\Requests\CheckRegistrationPhoneRequest;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
use App\Modules\Auth\Http\Requests\SendRegistrationCodeRequest;
use App\Modules\Auth\Http\Requests\VerifyRegistrationCodeRequest;
use App\Modules\Auth\Http\Resources\AuthTokenResource;
use App\Modules\Auth\Support\RegistrationTicket;
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
     * Регистрация — проверить телефон
     *
     * Шаги регистрации: 1) имя и фамилия — на сайте; 2) этот запрос — номер +992 настоящий и свободен;
     * 3) POST /auth/register/email — код на email; 4) POST /auth/register/email/verify — код → пропуск;
     * 5) POST /auth/register — пароль, аккаунт создан и вход выполнен.
     */
    public function checkPhone(CheckRegistrationPhoneRequest $request): JsonResponse
    {
        return response()->json(['data' => [
            /** @example +992931234567 */
            'phone' => $request->string('phone')->toString(),
        ]]);
    }

    /**
     * Регистрация — код на email
     *
     * Отправляет 6-значный код на адрес, если он настоящий и свободен. Повторно — не чаще раза в минуту.
     * Только при локальной разработке с почтой в лог ответ содержит и сам код (dev_code).
     *
     * @throws CodeRecentlySentException
     * @throws EmailNotDeliveredException
     */
    public function sendEmailCode(SendRegistrationCodeRequest $request, SendRegistrationCode $sendCode): JsonResponse
    {
        $email = $request->string('email')->toString();
        $code = $sendCode->handle($email);

        return response()->json([
            'data' => [
                /** @example client@gmail.com */
                'email' => $email,
                /** @example 15 */
                'expires_in_minutes' => VerificationCodes::ttlMinutes(),
                'dev_code' => app()->isLocal() && config('mail.default') === 'log' ? $code : null,
            ],
        ], 202);
    }

    /**
     * Регистрация — проверить код
     *
     * Верный код из письма подтверждает email и даёт пропуск (registration_token) на последний шаг.
     * Пропуск действует 30 минут. После 5 неверных попыток код сгорает — запросите новый.
     *
     * @throws InvalidVerificationCodeException
     */
    public function verifyEmail(VerifyRegistrationCodeRequest $request, VerifyRegistrationCode $verify): JsonResponse
    {
        $token = $verify->handle($request->string('email')->toString(), $request->string('code')->toString());

        return response()->json([
            'data' => [
                'registration_token' => $token,
                /** @example 30 */
                'expires_in_minutes' => RegistrationTicket::TTL_MINUTES,
            ],
        ]);
    }

    /**
     * Регистрация — создать аккаунт
     *
     * Последний шаг: пропуск из шага с кодом, имя, фамилия, телефон и пароль.
     * Создаёт аккаунт покупателя (роль client) с подтверждённым email и сразу возвращает токен.
     *
     * @throws RegistrationExpiredException
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
