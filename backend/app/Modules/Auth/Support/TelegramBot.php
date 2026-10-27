<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Small client of the Telegram Bot API (https://core.telegram.org/bots/api) for @BakhtStroyBot.
 */
final class TelegramBot
{
    public function __construct(private readonly string $token, public readonly string $username) {}

    public static function fromConfig(): self
    {
        $config = config('services.telegram_bot');

        return new self((string) ($config['token'] ?? ''), (string) ($config['username'] ?? ''));
    }

    /**
     * Deep link that opens the bot and passes $payload to /start.
     */
    public function link(?string $payload = null): string
    {
        return 'https://t.me/'.$this->username.($payload ? '?start='.$payload : '');
    }

    /**
     * @param  array<string, mixed>|null  $replyMarkup
     */
    public function sendMessage(int $chatId, string $text, ?array $replyMarkup = null): void
    {
        $this->call('sendMessage', array_filter([
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'reply_markup' => $replyMarkup,
        ], fn ($value) => $value !== null));
    }

    /**
     * Long polling for local development (no public address for a webhook).
     *
     * @return list<array<string, mixed>>
     */
    public function getUpdates(int $offset, int $timeout = 25): array
    {
        /** @var list<array<string, mixed>> $updates */
        $updates = $this->call('getUpdates', ['offset' => $offset, 'timeout' => $timeout, 'allowed_updates' => ['message']], $timeout + 10);

        return $updates;
    }

    public function setWebhook(string $url, string $secret): void
    {
        $this->call('setWebhook', ['url' => $url, 'secret_token' => $secret, 'allowed_updates' => ['message'], 'drop_pending_updates' => true]);
    }

    public function deleteWebhook(): void
    {
        $this->call('deleteWebhook', ['drop_pending_updates' => false]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function call(string $method, array $payload = [], int $timeout = 10): mixed
    {
        if ($this->token === '') {
            throw new RuntimeException('TELEGRAM_BOT_TOKEN is not set.');
        }

        try {
            $response = Http::connectTimeout(15)->timeout($timeout)->acceptJson()
                ->post("https://api.telegram.org/bot{$this->token}/{$method}", $payload);
        } catch (ConnectionException) {
            // Never put the URL into the message: it contains the bot token.
            throw new RuntimeException("Telegram {$method}: no connection to api.telegram.org");
        }

        if (! $response->json('ok')) {
            throw new RuntimeException("Telegram {$method} failed: ".$response->json('description', $response->body()));
        }

        return $response->json('result');
    }
}
