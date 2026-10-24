<?php

use App\Modules\Auth\Notifications\PasswordResetCodeNotification;
use App\Modules\User\Models\User;
use App\Shared\Notifications\Channels\SmsChannel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();

    $this->user = User::factory()->client()->create([
        'phone' => '+998901234567',
        'email' => 'client@example.com',
        'password' => 'old-secret1',
    ]);
});

function requestResetCode(object $test, string $login = '+998901234567'): string
{
    $test->postJson('/api/v1/auth/forgot-password', ['login' => $login])->assertAccepted();

    $code = null;
    Notification::assertSentTo($test->user, PasswordResetCodeNotification::class, function ($notification) use (&$code) {
        $code = $notification->code;

        return true;
    });

    return $code;
}

it('sends a 6-digit code by sms and email', function () {
    $code = requestResetCode($this);

    expect($code)->toMatch('/^\d{6}$/');

    Notification::assertSentTo($this->user, PasswordResetCodeNotification::class,
        fn ($notification, array $channels) => $channels === [SmsChannel::class, 'mail']);
});

it('sends the code only by sms when the user has no email', function () {
    $this->user->forceFill(['email' => null])->save();

    requestResetCode($this);

    Notification::assertSentTo($this->user, PasswordResetCodeNotification::class,
        fn ($notification, array $channels) => $channels === [SmsChannel::class]);
});

it('answers the same way for unknown accounts', function () {
    $this->postJson('/api/v1/auth/forgot-password', ['login' => '+998999999999'])
        ->assertAccepted()
        ->assertJsonPath('data.message', 'Если аккаунт существует, мы отправили код для сброса пароля.');

    Notification::assertNothingSent();
});

it('resets the password with a valid code and revokes all tokens', function () {
    $this->user->createToken('Phone');
    $code = requestResetCode($this);

    $this->postJson('/api/v1/auth/reset-password', [
        'login' => '+998 90 123 45 67',
        'code' => $code,
        'password' => 'new-secret1',
        'password_confirmation' => 'new-secret1',
    ])->assertOk();

    $this->user->refresh();

    expect(Hash::check('new-secret1', $this->user->password))->toBeTrue()
        ->and($this->user->tokens()->count())->toBe(0);

    $this->postJson('/api/v1/auth/login', ['login' => '+998901234567', 'password' => 'new-secret1'])->assertOk();
});

it('rejects a wrong code', function () {
    requestResetCode($this);

    $this->postJson('/api/v1/auth/reset-password', [
        'login' => '+998901234567',
        'code' => '000000',
        'password' => 'new-secret1',
        'password_confirmation' => 'new-secret1',
    ])->assertUnprocessable()->assertJsonPath('code', 'INVALID_RESET_CODE');

    expect(Hash::check('old-secret1', $this->user->refresh()->password))->toBeTrue();
});

it('rejects an expired code', function () {
    $code = requestResetCode($this);

    $this->travel(16)->minutes();

    $this->postJson('/api/v1/auth/reset-password', [
        'login' => '+998901234567',
        'code' => $code,
        'password' => 'new-secret1',
        'password_confirmation' => 'new-secret1',
    ])->assertUnprocessable()->assertJsonPath('code', 'INVALID_RESET_CODE');
});

it('blocks the code after 5 wrong attempts', function () {
    $code = requestResetCode($this);

    foreach (range(1, 5) as $attempt) {
        $this->app['db']->table('password_reset_tokens')->where('login', '+998901234567')->increment('attempts');
    }

    $this->postJson('/api/v1/auth/reset-password', [
        'login' => '+998901234567',
        'code' => $code,
        'password' => 'new-secret1',
        'password_confirmation' => 'new-secret1',
    ])->assertUnprocessable()->assertJsonPath('code', 'INVALID_RESET_CODE');
});

it('cannot reuse a code', function () {
    $code = requestResetCode($this);
    $payload = ['login' => '+998901234567', 'code' => $code, 'password' => 'new-secret1', 'password_confirmation' => 'new-secret1'];

    $this->postJson('/api/v1/auth/reset-password', $payload)->assertOk();
    $this->postJson('/api/v1/auth/reset-password', $payload)->assertUnprocessable();
});
