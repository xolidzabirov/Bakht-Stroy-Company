<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Controllers;

use App\Modules\Auth\Actions\HandleTelegramUpdate;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\ExcludeRouteFromDocs;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Telegram calls this for every message to @BakhtStroyBot (production, see `php artisan telegram:webhook`).
 * The secret header proves the request comes from Telegram.
 */
final class TelegramWebhookController extends Controller
{
    #[ExcludeRouteFromDocs]
    public function __invoke(Request $request, HandleTelegramUpdate $handle): Response
    {
        $secret = (string) config('services.telegram_bot.webhook_secret');

        abort_if($secret === '' || ! hash_equals($secret, (string) $request->header('X-Telegram-Bot-Api-Secret-Token')), 403);

        try {
            $handle->handle($request->all());
        } catch (Throwable $exception) {
            // Answer 200 anyway: otherwise Telegram repeats the same update again and again.
            Log::error('Telegram update failed: '.$exception->getMessage());
        }

        return response()->noContent();
    }
}
