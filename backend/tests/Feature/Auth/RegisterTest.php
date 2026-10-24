<?php

use App\Modules\Auth\Notifications\RegistrationCodeNotification;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

function sendRegistrationCode(object $test, string $email = 'client@gmail.com'): string
{
    $test->postJson('/api/v1/auth/register/send-code', ['email' => $email])
        ->assertAccepted()
        ->assertJsonPath('data.expires_in_minutes', 15);

    $code = null;
    Notification::assertSentOnDemand(RegistrationCodeNotification::class,
        function (RegistrationCodeNotification $notification, array $channels, AnonymousNotifiable $notifiable) use (&$code, $email) {
            if ($notifiable->routes['mail'] !== mb_strtolower($email)) {
                return false;
            }
            $code = $notification->code;

            return true;
        });

    return $code;
}

function registerPayload(string $code, array $overrides = []): array
{
    return array_merge([
        'name' => 'Халид',
        'email' => 'client@gmail.com',
        'code' => $code,
        'password' => 'secret123',
        'password_confirmation' => 'secret123',
        'phone' => '+998 90 123-45-67',
        'device_name' => 'Pest',
    ], $overrides);
}

it('registers a client in two steps: email code, then account', function () {
    $code = sendRegistrationCode($this, 'Client@Gmail.com');

    expect($code)->toMatch('/^\d{6}$/');

    $response = $this->postJson('/api/v1/auth/register', registerPayload($code, ['email' => 'CLIENT@gmail.com']));

    $response->assertCreated()
        ->assertJsonPath('data.user.name', 'Халид')
        ->assertJsonPath('data.user.email', 'client@gmail.com')
        ->assertJsonPath('data.user.phone', '+998901234567')
        ->assertJsonPath('data.user.roles', ['client'])
        ->assertJsonPath('data.user.email_verified_at', fn ($value) => $value !== null)
        ->assertJsonPath('data.token_type', 'Bearer')
        ->assertJsonMissingPath('data.user.password');

    $user = User::query()->where('email', 'client@gmail.com')->sole();

    expect($user->hasRole(Role::Client))->toBeTrue();

    $this->withToken($response->json('data.token'))->getJson('/api/v1/auth/me')->assertOk();
});

it('does not register without a valid email code', function (string $code) {
    sendRegistrationCode($this);

    $this->postJson('/api/v1/auth/register', registerPayload($code))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');

    expect(User::query()->count())->toBe(0);
})->with(['000000', '999999']);

it('does not accept a code sent to another email', function () {
    $code = sendRegistrationCode($this, 'other@gmail.com');

    $this->postJson('/api/v1/auth/register', registerPayload($code))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
});

it('does not accept an expired or reused code', function () {
    $code = sendRegistrationCode($this);
    $this->travel(16)->minutes();

    $this->postJson('/api/v1/auth/register', registerPayload($code))->assertUnprocessable();

    $this->travelBack();
    $this->travel(2)->minutes();
    $code = sendRegistrationCode($this);

    $this->postJson('/api/v1/auth/register', registerPayload($code))->assertCreated();
    $this->postJson('/api/v1/auth/register', registerPayload($code, ['email' => 'client@gmail.com']))
        ->assertUnprocessable(); // email is taken now
});

it('blocks the code after 5 wrong attempts', function () {
    $code = sendRegistrationCode($this);

    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/auth/register', registerPayload('000000'))->assertUnprocessable();
    }

    $this->postJson('/api/v1/auth/register', registerPayload($code))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
});

it('allows a new code only once a minute', function () {
    sendRegistrationCode($this);

    $this->postJson('/api/v1/auth/register/send-code', ['email' => 'client@gmail.com'])
        ->assertTooManyRequests()
        ->assertJsonPath('code', 'CODE_RECENTLY_SENT');

    $this->travel(61)->seconds();

    $this->postJson('/api/v1/auth/register/send-code', ['email' => 'client@gmail.com'])->assertAccepted();
});

it('does not send a code to an already registered email', function () {
    User::factory()->create(['email' => 'client@gmail.com']);

    $this->postJson('/api/v1/auth/register/send-code', ['email' => 'CLIENT@gmail.com'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'Этот email уже зарегистрирован.');

    Notification::assertNothingSent();
});

it('rejects email domains without a mail server when the DNS check is on', function () {
    config(['shop.email_dns_check' => true]);

    $this->postJson('/api/v1/auth/register/send-code', ['email' => 'user@no-such-domain-bakht-stroy.invalid'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    Notification::assertNothingSent();
});

it('allows one phone number for only one account', function () {
    User::factory()->create(['phone' => '+998901234567']);
    $code = sendRegistrationCode($this);

    $this->postJson('/api/v1/auth/register', registerPayload($code, ['phone' => '90 123 45 67']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.phone.0', 'Этот номер телефона уже привязан к другому аккаунту.');
});

it('allows registration without phone', function () {
    $code = sendRegistrationCode($this);

    $this->postJson('/api/v1/auth/register', registerPayload($code, ['phone' => null]))
        ->assertCreated()
        ->assertJsonPath('data.user.phone', null);
});

it('validates registration fields', function (array $payload, string $field) {
    $this->postJson('/api/v1/auth/register', registerPayload('123456', $payload))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'missing name' => [['name' => ''], 'name'],
    'missing email' => [['email' => ''], 'email'],
    'invalid email' => [['email' => 'not-an-email'], 'email'],
    'missing code' => [['code' => ''], 'code'],
    'short code' => [['code' => '123'], 'code'],
    'invalid phone' => [['phone' => '123'], 'phone'],
    'short password' => [['password' => 'abc1', 'password_confirmation' => 'abc1'], 'password'],
    'password without digits' => [['password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh'], 'password'],
    'password mismatch' => [['password_confirmation' => 'other1234'], 'password'],
]);

it('returns validation messages in russian', function () {
    $this->postJson('/api/v1/auth/register', [])
        ->assertUnprocessable()
        ->assertJsonPath('errors.name.0', 'Поле имя обязательно.');
});
