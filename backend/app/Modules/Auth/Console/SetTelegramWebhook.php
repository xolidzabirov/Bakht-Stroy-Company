<?php

declare(strict_types=1);

namespace App\Modules\Auth\Console;

use App\Modules\Auth\Support\TelegramBot;
use Illuminate\Console\Command;

/**
 * Production: tells Telegram where to send messages to the bot (once after deploy).
 * php artisan telegram:webhook https://api.example.tj
 */
final class SetTelegramWebhook extends Command
{
    protected $signature = 'telegram:webhook {base_url : Public HTTPS address of the API, e.g. https://api.bakhtstroy.tj}';

    protected $description = 'Point @BakhtStroyBot to the API webhook';

    public function handle(TelegramBot $bot): int
    {
        $secret = (string) config('services.telegram_bot.webhook_secret');

        if ($secret === '') {
            $this->error('Set TELEGRAM_WEBHOOK_SECRET in .env first.');

            return self::FAILURE;
        }

        $url = rtrim((string) $this->argument('base_url'), '/').'/api/v1/telegram/webhook';
        $bot->setWebhook($url, $secret);
        $this->info("Webhook set: {$url}");

        return self::SUCCESS;
    }
}
