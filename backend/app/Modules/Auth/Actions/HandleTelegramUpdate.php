<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\Support\BotPhoneCodeSender;
use App\Modules\Auth\Support\TelegramBot;
use App\Modules\Auth\Support\VerificationCodes;
use App\Shared\Support\Phone;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Messages to @BakhtStroyBot (webhook or polling):
 * /start → a "Share my number" button; the person's own contact → the number is remembered
 * and the waiting registration code is sent.
 */
final class HandleTelegramUpdate
{
    public function __construct(private readonly TelegramBot $bot) {}

    /**
     * @param  array<string, mixed>  $update
     */
    public function handle(array $update): void
    {
        /** @var array<string, mixed>|null $message */
        $message = $update['message'] ?? null;

        if (! is_array($message) || ($message['chat']['type'] ?? null) !== 'private') {
            return;
        }

        $chatId = (int) $message['chat']['id'];

        if (isset($message['contact']) && is_array($message['contact'])) {
            $this->contact($chatId, (int) ($message['from']['id'] ?? 0), $message['contact']);

            return;
        }

        $this->askForContact($chatId, (string) ($message['text'] ?? ''));
    }

    private function askForContact(int $chatId, string $text): void
    {
        $payload = str_starts_with($text, '/start ') ? trim(substr($text, 7)) : null;
        $phone = $payload ? Cache::get('telegram:start:'.$payload) : null;

        $greeting = is_string($phone)
            ? 'Здравствуйте! Вы регистрируетесь на сайте Bakht Stroy с номером <b>'.e($phone).'</b>.'
            : 'Здравствуйте! Это бот Bakht Stroy — через него приходят коды для регистрации на сайте.';

        $this->bot->sendMessage($chatId, $greeting."\n\nНажмите кнопку ниже, чтобы поделиться номером, — и бот пришлёт код.", [
            'keyboard' => [[['text' => '📱 Поделиться номером', 'request_contact' => true]]],
            'resize_keyboard' => true,
            'one_time_keyboard' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $contact
     */
    private function contact(int $chatId, int $fromId, array $contact): void
    {
        // Only the person's own number (the "Share my number" button), not someone else's contact card.
        if ((int) ($contact['user_id'] ?? 0) !== $fromId || $fromId === 0) {
            $this->bot->sendMessage($chatId, 'Отправьте, пожалуйста, свой номер — кнопкой «📱 Поделиться номером» ниже.');

            return;
        }

        $phone = Phone::normalize('+'.preg_replace('/\D+/', '', (string) ($contact['phone_number'] ?? '')));

        DB::table('telegram_chats')->upsert(
            ['phone' => $phone, 'chat_id' => $chatId, 'telegram_user_id' => $fromId, 'created_at' => now(), 'updated_at' => now()],
            ['phone'],
            ['chat_id', 'telegram_user_id', 'updated_at'],
        );

        $code = BotPhoneCodeSender::takePendingCode($phone);

        if ($code !== null) {
            $this->bot->sendMessage($chatId, BotPhoneCodeSender::codeMessage($code, VerificationCodes::ttlMinutes()), ['remove_keyboard' => true]);

            return;
        }

        $this->bot->sendMessage(
            $chatId,
            'Номер <b>'.e($phone).'</b> подтверждён ✅ Теперь коды для этого номера будут приходить сюда. Вернитесь на сайт и нажмите «Получить код».',
            ['remove_keyboard' => true],
        );
    }
}
