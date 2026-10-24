<?php

use App\Modules\User\Models\User;

beforeEach(function () {
    $this->user = User::factory()->client()->create([
        'phone' => '+998901234567',
        'email' => 'client@example.com',
        'password' => 'secret123',
    ]);
});

it('logs in by phone in any format', function (string $login) {
    $this->postJson('/api/v1/auth/login', ['login' => $login, 'password' => 'secret123'])
        ->assertOk()
        ->assertJsonPath('data.user.id', $this->user->id)
        ->assertJsonPath('data.user.roles', ['client'])
        ->assertJsonStructure(['data' => ['token', 'token_type', 'expires_at']]);
})->with(['+998901234567', '+998 90 123 45 67', '901234567']);

it('logs in by email case-insensitively', function () {
    $this->postJson('/api/v1/auth/login', ['login' => 'Client@Example.COM', 'password' => 'secret123'])
        ->assertOk()
        ->assertJsonPath('data.user.id', $this->user->id);
});

it('names the token after the device or user agent', function () {
    $this->postJson('/api/v1/auth/login', ['login' => '+998901234567', 'password' => 'secret123', 'device_name' => 'iPhone 15'])
        ->assertOk();

    $this->withHeader('User-Agent', 'Mozilla/5.0 Chrome')
        ->postJson('/api/v1/auth/login', ['login' => '+998901234567', 'password' => 'secret123'])
        ->assertOk();

    expect($this->user->tokens()->pluck('name')->all())->toBe(['iPhone 15', 'Mozilla/5.0 Chrome']);
});

it('rejects a wrong password', function () {
    $this->postJson('/api/v1/auth/login', ['login' => '+998901234567', 'password' => 'wrong-pass1'])
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Неверный логин или пароль.', 'code' => 'INVALID_CREDENTIALS']);
});

it('rejects an unknown login with the same error', function () {
    $this->postJson('/api/v1/auth/login', ['login' => '+998999999999', 'password' => 'secret123'])
        ->assertUnauthorized()
        ->assertJsonPath('code', 'INVALID_CREDENTIALS');
});

it('rejects a blocked user', function () {
    $this->user->forceFill(['blocked_at' => now()])->save();

    $this->postJson('/api/v1/auth/login', ['login' => '+998901234567', 'password' => 'secret123'])
        ->assertForbidden()
        ->assertJsonPath('code', 'ACCOUNT_BLOCKED');

    expect($this->user->tokens()->count())->toBe(0);
});

it('requires login and password', function () {
    $this->postJson('/api/v1/auth/login', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['login', 'password']);
});

it('limits login attempts to 5 per minute', function () {
    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/auth/login', ['login' => '+998901234567', 'password' => 'wrong-pass1'])
            ->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', ['login' => '+998901234567', 'password' => 'secret123'])
        ->assertTooManyRequests()
        ->assertJsonPath('code', 'TOO_MANY_REQUESTS')
        ->assertHeader('Retry-After');
});
