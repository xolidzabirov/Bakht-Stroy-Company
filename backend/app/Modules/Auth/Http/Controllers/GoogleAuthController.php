<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\SignInWithGoogle;
use App\Modules\Auth\Exceptions\GoogleSignInFailedException;
use App\Modules\Auth\Exceptions\StaffUsesPasswordException;
use App\Modules\Auth\Http\Requests\DeviceName;
use App\Modules\Auth\Http\Requests\GoogleCodeRequest;
use App\Modules\Auth\Http\Requests\GoogleUrlRequest;
use App\Modules\Auth\Http\Resources\AuthTokenResource;
use App\Modules\User\Exceptions\AccountBlockedException;
use App\Shared\Exceptions\GoogleNotConfiguredException;
use App\Shared\Http\Controllers\Controller;
use App\Shared\Support\GoogleOAuth;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Авторизация', weight: 1)]
final class GoogleAuthController extends Controller
{
    /**
     * Вход через Google — адрес
     *
     * Куда отправить человека: страница выбора аккаунта Google. Назад он вернётся на redirect_uri с кодом.
     *
     * @throws GoogleNotConfiguredException
     */
    public function url(GoogleUrlRequest $request, GoogleOAuth $google): JsonResponse
    {
        if (! $google->isConfigured()) {
            throw new GoogleNotConfiguredException;
        }

        return response()->json(['data' => [
            'url' => $google->authorizationUrl(
                $request->string('redirect_uri')->toString(),
                $request->string('state')->toString(),
                'openid email profile',
                ['prompt' => 'select_account'],
            ),
        ]]);
    }

    /**
     * Вход через Google
     *
     * Код от Google меняется на токены сайта. Покупателя без аккаунта сразу регистрирует: email уже подтверждён Google.
     * Сотрудники магазина входят только по паролю.
     *
     * @throws GoogleSignInFailedException
     * @throws StaffUsesPasswordException
     * @throws AccountBlockedException
     */
    public function signIn(GoogleCodeRequest $request, SignInWithGoogle $signIn): AuthTokenResource
    {
        return AuthTokenResource::make($signIn->handle(
            $request->string('code')->toString(),
            $request->string('redirect_uri')->toString(),
            DeviceName::from($request),
        ));
    }
}
