<?php

use App\Modules\Auth\Exceptions\PhoneNotOnTelegramException;
use App\Modules\Auth\Notifications\RegistrationCodeNotification;
use App\Modules\Auth\Support\RegistrationTicket;
use App\Modules\Auth\Support\TelegramGatewaySender;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

function requestEmailCode(object $test, string $email = 'firdavs@gmail.com')
{
    return $test->postJson('/api/v1/auth/register/email', ['email' => $email]);
}

/** The code that went to the address (the last letter). */
function codeSentTo(string $email): string
{
    $code = null;

    Notification::assertSentTo(new AnonymousNotifiable, RegistrationCodeNotification::class, function (RegistrationCodeNotification $notification, array $channels, AnonymousNotifiable $notifiable) use ($email, &$code) {
        if ($notifiable->routes['mail'] === $email) {
            $code = $notification->code;
        }

        return true;
    });

    return (string) $code;
}

function confirmEmail(object $test, string $email = 'firdavs@gmail.com'): string
{
    requestEmailCode($test, $email)->assertAccepted();

    return $test->postJson('/api/v1/auth/register/email/verify', ['email' => $email, 'code' => codeSentTo($email)])
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
        'phone' => '+992 93 123 45 67',
        'password' => 'Stroy2026!',
        'password_confirmation' => 'Stroy2026!',
    ], $overrides);
}

it('registers a client: name, phone, email, code from the letter, password — always as a client', function () {
    $this->postJson('/api/v1/auth/register/phone', ['phone' => '93 123 45 67'])->assertOk()->assertJsonPath('data.phone', '+992931234567');

    $token = confirmEmail($this);

    $response = $this->postJson('/api/v1/auth/register', accountPayload($token))
        ->assertCreated()
        ->assertJsonPath('data.user.name', 'Фирдавс Рахимов')
        ->assertJsonPath('data.user.email', 'firdavs@gmail.com')
        ->assertJsonPath('data.user.phone', '+992931234567')
        ->assertJsonPath('data.user.roles', ['client'])
        ->assertJsonStructure(['data' => ['token', 'expires_at']]);

    $user = User::query()->where('email', 'firdavs@gmail.com')->sole();
    expect($user->hasRole(Role::Client))->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->phone_verified_at)->toBeNull();

    // Signed in right away.
    $this->withToken($response->json('data.token'))->getJson('/api/v1/auth/me')->assertOk();
});

it('takes only real, free Tajik numbers', function (string $phone, string $message) {
    User::factory()->create(['phone' => '+992901112233']);

    $this->postJson('/api/v1/auth/register/phone', ['phone' => $phone])
        ->assertUnprocessable()
        ->assertJsonPath('errors.phone.0', $message);
})->with([
    'uzbek number' => ['+998 90 123 45 67', 'Нужен таджикский номер: +992 и 9 цифр, например +992 93 123 45 67.'],
    'too short' => ['93 123', 'Укажите номер с кодом страны, например +992 93 123 45 67.'],
    'letters' => ['+992 ab cd', 'Проверьте, пожалуйста, номер — кажется, в нём ошибка.'],
    'zero subscriber' => ['+992 93 000 00 00', 'Похоже, это не настоящий номер. Укажите номер, по которому с вами можно связаться.'],
    'empty' => ['', 'Укажите номер телефона.'],
    'taken' => ['+992 90 111 22 33', 'Этот номер уже зарегистрирован. Войдите в аккаунт или восстановите пароль.'],
]);

it('sends the code only to a valid address that is not registered yet', function () {
    User::factory()->create(['email' => 'taken@gmail.com']);

    requestEmailCode($this, 'not-an-email')->assertUnprocessable()->assertJsonValidationErrors('email');
    requestEmailCode($this, 'TAKEN@gmail.com')->assertUnprocessable()->assertJsonPath('errors.email.0', 'Этот email уже зарегистрирован.');

    Notification::assertNothingSent();
});

it('rejects email domains without a mail server when the DNS check is on', function () {
    config(['shop.email_dns_check' => true]);

    requestEmailCode($this, 'user@no-such-domain-bakht-stroy.invalid')->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('never reveals the code outside local development', function () {
    requestEmailCode($this)->assertAccepted()->assertJsonPath('data.dev_code', null);
});

it('sends a new code only once a minute', function () {
    requestEmailCode($this)->assertAccepted();

    requestEmailCode($this)
        ->assertTooManyRequests()
        ->assertJsonPath('code', 'CODE_RECENTLY_SENT');

    $this->travel(61)->seconds();
    requestEmailCode($this)->assertAccepted();
});

it('does not confirm the email with a wrong code and blocks it after 5 tries', function () {
    requestEmailCode($this)->assertAccepted();
    $right = codeSentTo('firdavs@gmail.com');
    $wrong = $right === '111111' ? '222222' : '111111';

    foreach (range(1, 5) as $_) {
        $this->postJson('/api/v1/auth/register/email/verify', ['email' => 'firdavs@gmail.com', 'code' => $wrong])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
    }

    $this->postJson('/api/v1/auth/register/email/verify', ['email' => 'firdavs@gmail.com', 'code' => $right])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
});

it('does not accept a code sent to another address', function () {
    requestEmailCode($this)->assertAccepted();

    $this->postJson('/api/v1/auth/register/email/verify', ['email' => 'other@gmail.com', 'code' => codeSentTo('firdavs@gmail.com')])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
});

it('creates the account only with a fresh pass from the code step', function () {
    $token = confirmEmail($this);

    $this->postJson('/api/v1/auth/register', accountPayload('forged-pass'))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'REGISTRATION_EXPIRED');

    $this->travel(31)->minutes();

    $this->postJson('/api/v1/auth/register', accountPayload($token))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'REGISTRATION_EXPIRED');

    expect(User::query()->where('email', 'firdavs@gmail.com')->exists())->toBeFalse();
});

it('does not give the same email or phone to two accounts even with two passes', function () {
    $first = RegistrationTicket::issue('firdavs@gmail.com');
    $second = RegistrationTicket::issue('firdavs@gmail.com');

    $this->postJson('/api/v1/auth/register', accountPayload($first))->assertCreated();

    $this->postJson('/api/v1/auth/register', accountPayload($second, ['phone' => '+992 90 765 43 21']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->postJson('/api/v1/auth/register', accountPayload(RegistrationTicket::issue('other@gmail.com')))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('phone');
});

it('validates the account fields', function (array $payload, string $field) {
    $this->postJson('/api/v1/auth/register', accountPayload(RegistrationTicket::issue('firdavs@gmail.com'), $payload))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'missing first name' => [['first_name' => ''], 'first_name'],
    'missing last name' => [['last_name' => ''], 'last_name'],
    'missing phone' => [['phone' => ''], 'phone'],
    'missing pass' => [['registration_token' => ''], 'registration_token'],
    'password mismatch' => [['password_confirmation' => 'Other2026!'], 'password'],
]);

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
