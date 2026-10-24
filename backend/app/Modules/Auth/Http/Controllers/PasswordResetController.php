<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\ResetPassword;
use App\Modules\Auth\Actions\SendPasswordResetCode;
use App\Modules\Auth\Exceptions\InvalidResetCodeException;
use App\Modules\Auth\Http\Requests\ForgotPasswordRequest;
use App\Modules\Auth\Http\Requests\ResetPasswordRequest;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Авторизация', weight: 1)]
final class PasswordResetController extends Controller
{
    /**
     * Забыли пароль — отправить код
     *
     * Отправляет 6-значный код по SMS (и на email, если он указан). Ответ всегда одинаковый,
     * даже если аккаунта нет. Локально SMS пишутся в storage/logs/sms.log.
     */
    public function forgot(ForgotPasswordRequest $request, SendPasswordResetCode $sendCode): JsonResponse
    {
        $sendCode->handle($request->string('login')->toString());

        return response()->json([
            'data' => [
                /** @example Если аккаунт существует, мы отправили код для сброса пароля. */
                'message' => 'Если аккаунт существует, мы отправили код для сброса пароля.',
            ],
        ], 202);
    }

    /**
     * Сброс пароля по коду
     *
     * Устанавливает новый пароль и выходит со всех устройств. Код действует 15 минут,
     * после 5 неверных попыток нужно запросить новый.
     *
     * @throws InvalidResetCodeException
     */
    public function reset(ResetPasswordRequest $request, ResetPassword $resetPassword): JsonResponse
    {
        $resetPassword->handle(
            $request->string('login')->toString(),
            $request->string('code')->toString(),
            $request->string('password')->toString(),
        );

        return response()->json([
            'data' => [
                /** @example Пароль изменён. Войдите с новым паролем. */
                'message' => 'Пароль изменён. Войдите с новым паролем.',
            ],
        ]);
    }
}
