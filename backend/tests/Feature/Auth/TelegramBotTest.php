<?php

use App\Modules\Auth\Actions\HandleTelegramUpdate;
use App\Modules\Auth\Actions\SendPhoneCode;
use App\Modules\Auth\Contracts\PhoneCodeSender;
use App\Modules\Auth\Support\BotPhoneCodeSender;
use App\Modules\Auth\Support\TelegramBot;
use App\Modules\Auth\Support\VerificationCodes;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * @BakhtStroyBot: codes for known numbers go straight to the chat, new numbers are confirmed
 * with the "Share my number" button first. Telegram is faked.
 */
beforeEach(function () {
    config([
        'services.telegram_gateway.driver' => 'bot',
        'services.telegram_bot.token' => '123:test',
        'services.telegram_bot.username' => 'BakhtStroyBot',
        'services.telegram_bot.webhook_secret' => 'secret-123',
    ]);
    Http::fake(['https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => true])]);
});

function telegramMessage(array $message): array
{
    return ['update_id' => 1, 'message' => array_merge(['chat' => ['id' => 777, 'type' => 'private'], 'from' => ['id' => 555]], $message)];
}

function sentToTelegram(string $method, ?Closure $check = null): bool
{
    return Http::recorded(fn (Request $request) => str_ends_with($request->url(), "/{$method}") && ($check === null || $check($request)))->isNotEmpty();
}

it('sends the code straight to the chat of a number known to the bot', function () {
    DB::table('telegram_chats')->insert(['phone' => '+992931234567', 'chat_id' => 777, 'telegram_user_id' => 555, 'created_at' => now(), 'updated_at' => now()]);

    $delivery = app(SendPhoneCode::class)->handle('+992931234567');

    expect($delivery->delivered)->toBeTrue()->and($delivery->botLink)->toBeNull();

    expect(sentToTelegram('sendMessage', fn (Request $r) => $r['chat_id'] === 777 && preg_match('/<b>\d{6}<\/b>/', $r['text']) === 1))->toBeTrue();
});

it('asks to open the bot for a new number and sends the code after the person shares it', function () {
    $delivery = app(SendPhoneCode::class)->handle('+992931234567');

    $link = (string) $delivery->botLink;
    expect($delivery->delivered)->toBeFalse()
        ->and($link)->toStartWith('https://t.me/BakhtStroyBot?start=')
        ->and(sentToTelegram('sendMessage'))->toBeFalse();

    $handle = app(HandleTelegramUpdate::class);

    // /start from the link → the bot shows the "Share my number" button.
    $handle->handle(telegramMessage(['text' => '/start '.substr($link, strpos($link, '=') + 1)]));
    expect(sentToTelegram('sendMessage', fn (Request $r) => str_contains($r['text'], '+992931234567')
        && ($r['reply_markup']['keyboard'][0][0]['request_contact'] ?? false) === true))->toBeTrue();

    // The person's own number → remembered, the waiting code is sent.
    $handle->handle(telegramMessage(['contact' => ['phone_number' => '992931234567', 'user_id' => 555]]));

    expect(DB::table('telegram_chats')->where('phone', '+992931234567')->value('chat_id'))->toBe(777)
        ->and(sentToTelegram('sendMessage', fn (Request $r) => preg_match('/<b>(\d{6})<\/b>/', $r['text']) === 1))->toBeTrue();

    // That code confirms the number.
    $sent = Http::recorded(fn (Request $r) => preg_match('/<b>\d{6}<\/b>/', (string) ($r['text'] ?? '')) === 1)->first()[0];
    preg_match('/<b>(\d{6})<\/b>/', $sent['text'], $match);

    expect(VerificationCodes::phoneOwnership()->check('+992931234567', $match[1]))->toBeTrue();
});

it('sends a new number straight through Telegram Gateway when its token is set', function () {
    config(['services.telegram_gateway.token' => 'gateway-token']);
    Http::fake([
        '*/checkSendAbility' => Http::response(['ok' => true, 'result' => ['request_id' => 'req-9']]),
        '*/sendVerificationMessage' => Http::response(['ok' => true, 'result' => ['request_id' => 'req-9']]),
        'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => true]),
    ]);

    $delivery = app(SendPhoneCode::class)->handle('+992931234567');

    expect($delivery->delivered)->toBeTrue()->and($delivery->botLink)->toBeNull();

    expect(sentToTelegram('sendVerificationMessage', fn (Request $r) => $r['phone_number'] === '+992931234567'))->toBeTrue()
        ->and(sentToTelegram('sendMessage'))->toBeFalse();
});

it('falls back to the bot link when Telegram Gateway has no money', function () {
    config(['services.telegram_gateway.token' => 'gateway-token']);
    Http::fake([
        '*/checkSendAbility' => Http::response(['ok' => false, 'error' => 'BALANCE_NOT_ENOUGH']),
        'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => true]),
    ]);

    $delivery = app(SendPhoneCode::class)->handle('+992931234567');

    expect($delivery->delivered)->toBeFalse()->and($delivery->botLink)->toStartWith('https://t.me/BakhtStroyBot?start=');
});

it('does not accept someone else\'s contact card', function () {
    app(HandleTelegramUpdate::class)->handle(telegramMessage(['contact' => ['phone_number' => '+992931234567', 'user_id' => 999]]));

    expect(DB::table('telegram_chats')->count())->toBe(0)
        ->and(sentToTelegram('sendMessage', fn (Request $r) => str_contains($r['text'], 'свой номер')))->toBeTrue();
});

it('uses the bot sender only with a token', function () {
    expect(app(PhoneCodeSender::class))->toBeInstanceOf(BotPhoneCodeSender::class);

    config(['services.telegram_bot.token' => null]);
    expect(app(PhoneCodeSender::class))->not->toBeInstanceOf(BotPhoneCodeSender::class);
});

it('takes webhook calls only with the Telegram secret', function () {
    $update = telegramMessage(['text' => '/start']);

    $this->postJson('/api/v1/telegram/webhook', $update)->assertForbidden();
    $this->postJson('/api/v1/telegram/webhook', $update, ['X-Telegram-Bot-Api-Secret-Token' => 'wrong'])->assertForbidden();
    $this->postJson('/api/v1/telegram/webhook', $update, ['X-Telegram-Bot-Api-Secret-Token' => 'secret-123'])->assertNoContent();

    expect(sentToTelegram('sendMessage'))->toBeTrue()
        ->and(app(TelegramBot::class)->link('x'))->toBe('https://t.me/BakhtStroyBot?start=x');
});
