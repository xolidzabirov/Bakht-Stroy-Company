<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use App\Modules\Auth\Contracts\PhoneCodeSender;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Codes through @BakhtStroyBot (free). A bot cannot write first, so:
 * - the number was already shared with the bot → the code goes to that chat at once;
 * - not yet, and Telegram Gateway is configured → Gateway sends the code straight to the number (paid);
 * - not yet, no Gateway → the code waits; the person opens the bot (link), taps "Share my number",
 *   Telegram proves the number is theirs, and the bot sends the waiting code (HandleTelegramUpdate).
 */
final class BotPhoneCodeSender implements PhoneCodeSender
{
    public function __construct(private readonly TelegramBot $bot, private readonly ?PhoneCodeSender $gateway = null) {}

    public function send(string $phone, string $code, int $ttlMinutes): PhoneCodeDelivery
    {
        $chatId = DB::table('telegram_chats')->where('phone', $phone)->value('chat_id');

        if ($chatId !== null) {
            $this->bot->sendMessage((int) $chatId, self::codeMessage($code, $ttlMinutes), ['remove_keyboard' => true]);

            return PhoneCodeDelivery::delivered();
        }

        if ($this->gateway !== null) {
            return $this->gateway->send($phone, $code, $ttlMinutes);
        }

        Cache::put(self::pendingKey($phone), Crypt::encryptString($code), now()->addMinutes($ttlMinutes));

        $nonce = Str::random(24);
        Cache::put('telegram:start:'.$nonce, $phone, now()->addMinutes($ttlMinutes));

        return PhoneCodeDelivery::viaBot($this->bot->link($nonce));
    }

    /**
     * The code waiting for this phone (and forget it), or null.
     */
    public static function takePendingCode(string $phone): ?string
    {
        $encrypted = Cache::pull(self::pendingKey($phone));

        return is_string($encrypted) ? Crypt::decryptString($encrypted) : null;
    }

    public static function codeMessage(string $code, int $ttlMinutes): string
    {
        return "🔐 Код для регистрации на сайте Bakht Stroy: <b>{$code}</b>\n\n"
            ."Действует {$ttlMinutes} минут. Никому его не сообщайте — сотрудники Bakht Stroy его не спрашивают.";
    }

    private static function pendingKey(string $phone): string
    {
        return 'telegram:pending-code:'.$phone;
    }
}
