<?php

use App\Modules\User\Models\User;

beforeEach(function () {
    $this->user = User::factory()->client()->create([
        'email' => 'client@gmail.com',
        'password' => 'secret123',
    ]);
});

it('logs in by email', function () {
    $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'secret123'])
        ->assertOk()
        ->assertJsonPath('data.user.id', $this->user->id)
        ->assertJsonPath('data.user.roles', ['client'])
        ->assertJsonStructure(['data' => ['token', 'token_type', 'expires_at']]);
});

it('ignores email letter case and spaces', function () {
    $this->postJson('/api/v1/auth/login', ['email' => ' Client@Gmail.COM ', 'password' => 'secret123'])
        ->assertOk()
        ->assertJsonPath('data.user.id', $this->user->id);
});

it('does not log in by phone', function () {
    $this->postJson('/api/v1/auth/login', ['email' => $this->user->phone, 'password' => 'secret123'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('names the token after the device or user agent', function () {
    $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'secret123', 'device_name' => 'iPhone 15'])
        ->assertOk();

    $this->withHeader('User-Agent', 'Mozilla/5.0 Chrome')
        ->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'secret123'])
        ->assertOk();

    expect($this->user->tokens()->pluck('name')->all())->toBe(['iPhone 15', 'Mozilla/5.0 Chrome']);
});

it('rejects a wrong password', function () {
    $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'wrong-pass1'])
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Неверный email или пароль.', 'code' => 'INVALID_CREDENTIALS']);
});

it('rejects an unknown email with the same error', function () {
    $this->postJson('/api/v1/auth/login', ['email' => 'nobody@gmail.com', 'password' => 'secret123'])
        ->assertUnauthorized()
        ->assertJsonPath('code', 'INVALID_CREDENTIALS');
});

it('rejects a blocked user', function () {
    $this->user->forceFill(['blocked_at' => now()])->save();

    $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'secret123'])
        ->assertForbidden()
        ->assertJsonPath('code', 'ACCOUNT_BLOCKED');

    expect($this->user->tokens()->count())->toBe(0);
});

it('requires email and password', function () {
    $this->postJson('/api/v1/auth/login', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'password']);
});

it('limits login attempts to 5 per minute', function () {
    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'wrong-pass1'])
            ->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'secret123'])
        ->assertTooManyRequests()
        ->assertJsonPath('code', 'TOO_MANY_REQUESTS')
        ->assertHeader('Retry-After');
});
