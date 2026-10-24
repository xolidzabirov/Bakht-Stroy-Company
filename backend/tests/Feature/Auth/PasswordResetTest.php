<?php

use App\Modules\Auth\Notifications\PasswordResetCodeNotification;
use App\Modules\User\Models\User;
use App\Shared\Notifications\Channels\SmsChannel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();

    $this->user = User::factory()->client()->create([
        'email' => 'client@gmail.com',
        'phone' => '+998901234567',
        'password' => 'old-secret1',
    ]);
});

function requestResetCode(object $test, string $email = 'client@gmail.com'): string
{
    $test->postJson('/api/v1/auth/forgot-password', ['email' => $email])->assertAccepted();

    $code = null;
    Notification::assertSentTo($test->user, PasswordResetCodeNotification::class, function ($notification) use (&$code) {
        $code = $notification->code;

        return true;
    });

    return $code;
}

function resetPayload(string $code, array $overrides = []): array
{
    return array_merge([
        'email' => 'client@gmail.com',
        'code' => $code,
        'password' => 'new-secret1',
        'password_confirmation' => 'new-secret1',
    ], $overrides);
}

it('sends a 6-digit code by email and sms', function () {
    $code = requestResetCode($this);

    expect($code)->toMatch('/^\d{6}$/');

    Notification::assertSentTo($this->user, PasswordResetCodeNotification::class,
        fn ($notification, array $channels) => $channels === ['mail', SmsChannel::class]);
});

it('sends the code only by email when the user has no phone', function () {
    $this->user->forceFill(['phone' => null])->save();

    requestResetCode($this);

    Notification::assertSentTo($this->user, PasswordResetCodeNotification::class,
        fn ($notification, array $channels) => $channels === ['mail']);
});

it('answers the same way for unknown accounts', function () {
    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@gmail.com'])
        ->assertAccepted()
        ->assertJsonPath('data.message', 'Если аккаунт существует, мы отправили код для сброса пароля.');

    Notification::assertNothingSent();
});

it('resets the password with a valid code and revokes all tokens', function () {
    $this->user->createToken('Phone');
    $code = requestResetCode($this);

    $this->postJson('/api/v1/auth/reset-password', resetPayload($code, ['email' => 'Client@Gmail.com']))->assertOk();

    $this->user->refresh();

    expect(Hash::check('new-secret1', $this->user->password))->toBeTrue()
        ->and($this->user->tokens()->count())->toBe(0);

    $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'new-secret1'])->assertOk();
});

it('rejects a wrong code', function () {
    requestResetCode($this);

    $this->postJson('/api/v1/auth/reset-password', resetPayload('000000'))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_RESET_CODE');

    expect(Hash::check('old-secret1', $this->user->refresh()->password))->toBeTrue();
});

it('rejects an expired code', function () {
    $code = requestResetCode($this);

    $this->travel(16)->minutes();

    $this->postJson('/api/v1/auth/reset-password', resetPayload($code))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_RESET_CODE');
});

it('blocks the code after 5 wrong attempts', function () {
    $code = requestResetCode($this);

    foreach (range(1, 5) as $attempt) {
        $this->app['db']->table('password_reset_tokens')->where('email', 'client@gmail.com')->increment('attempts');
    }

    $this->postJson('/api/v1/auth/reset-password', resetPayload($code))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_RESET_CODE');
});

it('cannot reuse a code', function () {
    $code = requestResetCode($this);

    $this->postJson('/api/v1/auth/reset-password', resetPayload($code))->assertOk();
    $this->postJson('/api/v1/auth/reset-password', resetPayload($code))->assertUnprocessable();
});
