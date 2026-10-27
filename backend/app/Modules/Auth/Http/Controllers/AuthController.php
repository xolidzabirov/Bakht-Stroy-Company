<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\LoginUser;
use App\Modules\Auth\Actions\LogoutUser;
use App\Modules\Auth\Actions\RegisterUser;
use App\Modules\Auth\Actions\SendPhoneCode;
use App\Modules\Auth\Actions\VerifyPhoneCode;
use App\Modules\Auth\Exceptions\CodeRecentlySentException;
use App\Modules\Auth\Exceptions\InvalidCredentialsException;
use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Exceptions\PhoneNotOnTelegramException;
use App\Modules\Auth\Exceptions\RegistrationExpiredException;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Requests\RegisterRequest;
use App\Modules\Auth\Http\Requests\SendPhoneCodeRequest;
use App\Modules\Auth\Http\Requests\VerifyPhoneCodeRequest;
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
     * Регистрация — код в Telegram
     *
     * Шаги регистрации: 1) имя, фамилия и «кто вы» — только на сайте; 2) этот запрос — номер +992,
     * на его Telegram приходит 6-значный код; 3) POST /auth/register/phone/verify — код → пропуск;
     * 4) POST /auth/register — email и пароль, аккаунт создан.
     *
     * Номер должен быть таджикским, настоящим, свободным и с Telegram. Повторно — не чаще раза в минуту.
     * Локально (TELEGRAM_CODES_DRIVER=log) код пишется в storage/logs/laravel-<дата>.log.
     *
     * @throws CodeRecentlySentException
     * @throws PhoneNotOnTelegramException
     */
    public function sendPhoneCode(SendPhoneCodeRequest $request, SendPhoneCode $sendCode): JsonResponse
    {
        $phone = $request->string('phone')->toString();
        $sendCode->handle($phone);

        return response()->json([
            'data' => [
                /** @example Код отправлен в Telegram. */
                'message' => 'Код отправлен в Telegram.',
                /** @example +992931234567 */
                'phone' => $phone,
                /** @example 15 */
                'expires_in_minutes' => VerificationCodes::ttlMinutes(),
            ],
        ], 202);
    }

    /**
     * Регистрация — проверить код
     *
     * Верный код из Telegram подтверждает номер и даёт пропуск (registration_token) на последний шаг.
     * Пропуск действует 30 минут. После 5 неверных попыток код сгорает — запросите новый.
     *
     * @throws InvalidVerificationCodeException
     */
    public function verifyPhone(VerifyPhoneCodeRequest $request, VerifyPhoneCode $verify): JsonResponse
    {
        $token = $verify->handle($request->string('phone')->toString(), $request->string('code')->toString());

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
     * Последний шаг: пропуск из шага с кодом, имя, фамилия, «кто вы», email и пароль.
     * Создаёт аккаунт покупателя (роль client) с подтверждённым телефоном и сразу возвращает токен.
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
