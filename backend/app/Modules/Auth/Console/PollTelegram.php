<?php

declare(strict_types=1);

namespace App\Modules\Auth\Console;

use App\Modules\Auth\Actions\HandleTelegramUpdate;
use App\Modules\Auth\Support\TelegramBot;
use Illuminate\Console\Command;
use Throwable;

/**
 * Local development: reads messages to the bot by long polling (a webhook needs a public HTTPS address).
 * Keep it running while testing registration: php artisan telegram:poll
 */
final class PollTelegram extends Command
{
    protected $signature = 'telegram:poll {--once : Read one batch of updates and stop}';

    protected $description = 'Read messages to @BakhtStroyBot without a webhook (local development)';

    public function handle(TelegramBot $bot, HandleTelegramUpdate $handle): int
    {
        // Polling works only without a webhook; keep trying while the connection is down.
        while (true) {
            try {
                $bot->deleteWebhook();
                break;
            } catch (Throwable $exception) {
                $this->warn($exception->getMessage().' — retrying in 5 s');
                sleep(5);
            }
        }

        $this->info("Listening to @{$bot->username}… (Ctrl+C to stop)");
        $offset = 0;

        do {
            try {
                foreach ($bot->getUpdates($offset, $this->option('once') ? 0 : 25) as $update) {
                    $offset = (int) $update['update_id'] + 1;
                    $handle->handle($update);
                    $this->line('update '.$update['update_id'].' handled');
                }
            } catch (Throwable $exception) {
                $this->error($exception->getMessage());
                sleep(3);
            }
        } while (! $this->option('once'));

        return self::SUCCESS;
    }
}
