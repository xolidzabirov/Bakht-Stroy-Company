<?php

use App\Modules\Auth\Contracts\PhoneCodeSender;
use App\Modules\Auth\Exceptions\PhoneNotOnTelegramException;
use App\Modules\Auth\Support\PhoneCodeDelivery;
use App\Modules\Auth\Support\RegistrationTicket;
use App\Modules\Auth\Support\TelegramGatewaySender;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

/**
 * Telegram is replaced by a fake that remembers the codes (and can pretend a number has no Telegram).
 */
beforeEach(function () {
    $this->telegram = new class implements PhoneCodeSender
    {
        /** @var array<string, string> */
        public array $codes = [];

        /** @var list<string> */
        public array $withoutTelegram = [];

        public function send(string $phone, string $code, int $ttlMinutes): PhoneCodeDelivery
        {
            if (in_array($phone, $this->withoutTelegram, true)) {
                throw new PhoneNotOnTelegramException;
            }

            $this->codes[$phone] = $code;

            return PhoneCodeDelivery::delivered();
        }
    };

    $this->app->instance(PhoneCodeSender::class, $this->telegram);
});

function requestPhoneCode(object $test, string $phone = '+992 93 123 45 67')
{
    return $test->postJson('/api/v1/auth/register/phone', ['phone' => $phone]);
}

function confirmPhone(object $test, string $phone = '+992931234567'): string
{
    requestPhoneCode($test, $phone)->assertAccepted();

    return $test->postJson('/api/v1/auth/register/phone/verify', ['phone' => $phone, 'code' => $test->telegram->codes[$phone]])
        ->assertOk()
        ->assertJsonPath('data.expires_in_minutes', 30)
        ->json('data.registration_token');
}

function accountPayload(string $token, array $overrides = []): array
{
    return array_merge([
        'registration_token' => $token,
        'first_name' => 'Фирдавс',
        'last_name' => 'Рахимов',
        'email' => 'firdavs@gmail.com',
        'password' => 'Stroy2026!',
        'password_confirmation' => 'Stroy2026!',
    ], $overrides);
}

it('registers a client: name, phone, Telegram code, email and password — always as a client', function () {
    $token = confirmPhone($this);

    $response = $this->postJson('/api/v1/auth/register', accountPayload($token))
        ->assertCreated()
        ->assertJsonPath('data.user.name', 'Фирдавс Рахимов')
        ->assertJsonPath('data.user.phone', '+992931234567')
        ->assertJsonPath('data.user.roles', ['client'])
        ->assertJsonStructure(['data' => ['token', 'expires_at']]);

    $user = User::query()->where('phone', '+992931234567')->sole();
    expect($user->hasRole(Role::Client))->toBeTrue()
        ->and($user->phone_verified_at)->not->toBeNull()
        ->and($user->email_verified_at)->toBeNull();

    // Signed in right away.
    $this->withToken($response->json('data.token'))->getJson('/api/v1/auth/me')->assertOk();
});

it('accepts the 9 local digits typed after the fixed +992', function () {
    requestPhoneCode($this, '93 123 45 67')
        ->assertAccepted()
        ->assertJsonPath('data.phone', '+992931234567');

    expect($this->telegram->codes)->toHaveKey('+992931234567');
});

it('takes only real Tajik numbers', function (string $phone, string $message) {
    requestPhoneCode($this, $phone)
        ->assertUnprocessable()
        ->assertJsonPath('errors.phone.0', $message);

    expect($this->telegram->codes)->toBeEmpty();
})->with([
    'uzbek number' => ['+998 90 123 45 67', 'Нужен таджикский номер: +992 и 9 цифр, например +992 93 123 45 67.'],
    'too short' => ['93 123', 'Укажите номер с кодом страны, например +992 93 123 45 67.'],
    'letters' => ['+992 ab cd', 'Проверьте, пожалуйста, номер — кажется, в нём ошибка.'],
    'zero subscriber' => ['+992 93 000 00 00', 'Похоже, это не настоящий номер. Укажите номер, по которому с вами можно связаться.'],
    'empty' => ['', 'Укажите номер телефона.'],
]);

it('allows one phone number for only one account', function () {
    User::factory()->create(['phone' => '+992931234567']);

    requestPhoneCode($this)
        ->assertUnprocessable()
        ->assertJsonPath('errors.phone.0', 'Этот номер уже зарегистрирован. Войдите в аккаунт или восстановите пароль.');
});

it('says when the number has no Telegram and lets the person fix it at once', function () {
    $this->telegram->withoutTelegram = ['+992931234567'];

    requestPhoneCode($this)
        ->assertUnprocessable()
        ->assertJsonPath('code', 'PHONE_NOT_ON_TELEGRAM');

    // No "wait a minute" after a failed send.
    $this->telegram->withoutTelegram = [];
    requestPhoneCode($this)->assertAccepted();
});

it('sends a new code only once a minute', function () {
    requestPhoneCode($this)->assertAccepted();

    requestPhoneCode($this)
        ->assertTooManyRequests()
        ->assertJsonPath('code', 'CODE_RECENTLY_SENT');

    $this->travel(61)->seconds();
    requestPhoneCode($this)->assertAccepted();
});

it('does not confirm the phone with a wrong code and blocks it after 5 tries', function () {
    requestPhoneCode($this)->assertAccepted();
    $right = $this->telegram->codes['+992931234567'];
    $wrong = $right === '111111' ? '222222' : '111111';

    foreach (range(1, 5) as $_) {
        $this->postJson('/api/v1/auth/register/phone/verify', ['phone' => '+992931234567', 'code' => $wrong])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
    }

    $this->postJson('/api/v1/auth/register/phone/verify', ['phone' => '+992931234567', 'code' => $right])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
});

it('does not accept a code sent to another number', function () {
    requestPhoneCode($this, '+992931234567')->assertAccepted();

    $this->postJson('/api/v1/auth/register/phone/verify', ['phone' => '+992901234567', 'code' => $this->telegram->codes['+992931234567']])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
});

it('creates the account only with a fresh pass from the code step', function () {
    $token = confirmPhone($this);

    $this->postJson('/api/v1/auth/register', accountPayload('forged-pass'))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'REGISTRATION_EXPIRED');

    $this->travel(31)->minutes();

    $this->postJson('/api/v1/auth/register', accountPayload($token))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'REGISTRATION_EXPIRED');

    expect(User::query()->where('phone', '+992931234567')->exists())->toBeFalse();
});

it('does not give the same phone to two accounts even with two passes', function () {
    $first = RegistrationTicket::issue('+992931234567');
    $second = RegistrationTicket::issue('+992931234567');

    $this->postJson('/api/v1/auth/register', accountPayload($first))->assertCreated();

    $this->postJson('/api/v1/auth/register', accountPayload($second, ['email' => 'other@gmail.com']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('phone');
});

it('validates the account fields', function (array $payload, string $field) {
    $this->postJson('/api/v1/auth/register', accountPayload(RegistrationTicket::issue('+992931234567'), $payload))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'missing first name' => [['first_name' => ''], 'first_name'],
    'missing last name' => [['last_name' => ''], 'last_name'],
    'missing email' => [['email' => ''], 'email'],
    'invalid email' => [['email' => 'not-an-email'], 'email'],
    'missing pass' => [['registration_token' => ''], 'registration_token'],
    'password mismatch' => [['password_confirmation' => 'Other2026!'], 'password'],
]);

it('does not register an email that is already used', function () {
    User::factory()->create(['email' => 'firdavs@gmail.com']);

    $this->postJson('/api/v1/auth/register', accountPayload(RegistrationTicket::issue('+992931234567')))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('rejects email domains without a mail server when the DNS check is on', function () {
    config(['shop.email_dns_check' => true]);

    $this->postJson('/api/v1/auth/register', accountPayload(RegistrationTicket::issue('+992931234567'), ['email' => 'user@no-such-domain-bakht-stroy.invalid']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('returns validation messages in russian', function () {
    $this->postJson('/api/v1/auth/register', [])
        ->assertUnprocessable()
        ->assertJsonPath('errors.first_name.0', 'Поле имя обязательно.');
});

it('sends the code through Telegram Gateway only to numbers with Telegram', function () {
    Http::fake([
        '*/checkSendAbility' => Http::sequence()
            ->push(['ok' => true, 'result' => ['request_id' => 'req-1']])
            ->push(['ok' => false, 'error' => 'PHONE_NUMBER_INVALID']),
        '*/sendVerificationMessage' => Http::response(['ok' => true, 'result' => ['request_id' => 'req-1']]),
    ]);
    $gateway = new TelegramGatewaySender('test-token', 'https://gatewayapi.telegram.org');

    $gateway->send('+992931234567', '123456', 15);

    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/sendVerificationMessage')
        && $request['phone_number'] === '+992931234567'
        && $request['code'] === '123456'
        && $request['request_id'] === 'req-1'
        && $request->hasHeader('Authorization', 'Bearer test-token'));

    expect(fn () => $gateway->send('+992901234567', '654321', 15))->toThrow(PhoneNotOnTelegramException::class);
});
