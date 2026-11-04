<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Controllers;

use App\Modules\Auth\Http\Requests\GoogleCodeRequest;
use App\Modules\Auth\Http\Requests\GoogleUrlRequest;
use App\Modules\Content\Exceptions\GmailConnectFailedException;
use App\Modules\Content\Exceptions\GmailSendFailedException;
use App\Modules\Content\Support\DatabaseShopSettings;
use App\Modules\Content\Support\GmailConnection;
use App\Shared\Exceptions\GoogleNotConfiguredException;
use App\Shared\Exceptions\GoogleOAuthException;
use App\Shared\Http\Controllers\Controller;
use App\Shared\Support\GoogleOAuth;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

/**
 * Gmail that sends the shop's letters (administrator only).
 */
#[Group('Админ: настройки и контент', weight: 15)]
final class MailConnectionController extends Controller
{
    private const GMAIL_SEND = 'https://www.googleapis.com/auth/gmail.send';

    public function __construct(private GmailConnection $connection, private GoogleOAuth $google) {}

    /**
     * Почта: состояние
     */
    public function show(): JsonResponse
    {
        return $this->status();
    }

    /**
     * Почта: адрес подключения
     *
     * Страница Google, где владелец почты разрешает магазину отправлять письма.
     *
     * @throws GoogleNotConfiguredException
     */
    public function url(GoogleUrlRequest $request, DatabaseShopSettings $settings): JsonResponse
    {
        if (! $this->google->isConfigured()) {
            throw new GoogleNotConfiguredException;
        }

        return response()->json(['data' => [
            'url' => $this->google->authorizationUrl(
                $request->string('redirect_uri')->toString(),
                $request->string('state')->toString(),
                'openid email '.self::GMAIL_SEND,
                // offline + consent: only this way Google gives the long-lived token.
                ['access_type' => 'offline', 'prompt' => 'consent', 'login_hint' => (string) ($settings->get('store')['email'] ?? '')],
            ),
        ]]);
    }

    /**
     * Почта: подключить Gmail
     *
     * @throws GmailConnectFailedException
     */
    public function connect(GoogleCodeRequest $request): JsonResponse
    {
        try {
            $tokens = $this->google->exchangeCode($request->string('code')->toString(), $request->string('redirect_uri')->toString());
            $email = $this->google->profile($tokens['access_token'])['email'] ?? null;
        } catch (GoogleOAuthException $exception) {
            Log::warning('Gmail connection failed: '.$exception->getMessage());

            throw new GmailConnectFailedException;
        }

        // The person can untick "send email" on Google's page, and without it the mailbox is of no use.
        if (! is_string($email) || empty($tokens['refresh_token']) || ! str_contains((string) ($tokens['scope'] ?? ''), self::GMAIL_SEND)) {
            throw new GmailConnectFailedException;
        }

        $this->connection->save($email, $tokens['refresh_token']);

        return $this->status();
    }

    /**
     * Почта: проверочное письмо
     *
     * @throws GmailSendFailedException
     */
    public function test(): JsonResponse
    {
        $email = $this->connection->email() ?? throw new GmailSendFailedException;

        try {
            Mail::raw('Почта магазина работает: коды подтверждения и письма о заказах отправляются с этого адреса.', function ($message) use ($email): void {
                $message->to($email)->subject('Проверка почты Bakht Stroy');
            });
        } catch (TransportExceptionInterface $exception) {
            Log::error('Test email failed: '.$exception->getMessage());

            throw new GmailSendFailedException;
        }

        return response()->json(['data' => ['sent_to' => $email]]);
    }

    /**
     * Почта: отключить Gmail
     */
    public function disconnect(): Response
    {
        $this->connection->forget();

        return response()->noContent();
    }

    private function status(): JsonResponse
    {
        return response()->json(['data' => [
            /** Ключи Google добавлены на сервере. */
            'configured' => $this->google->isConfigured(),
            'connected' => $this->connection->isConnected(),
            /** @example shop@gmail.com */
            'email' => $this->connection->email(),
            /** Google отозвал доступ: нужно подключить заново. */
            'broken' => $this->connection->isBroken(),
            /** Письма идут через Gmail (а не другим способом из настроек сервера). */
            'active' => config('mail.default') === 'gmail',
        ]]);
    }
}
