<?php

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;

function registerPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Халид',
        'email' => 'Client@Gmail.com',
        'password' => 'secret123',
        'password_confirmation' => 'secret123',
        'phone' => '+998 90 123-45-67',
        'device_name' => 'Pest',
    ], $overrides);
}

it('registers a client and returns a token', function () {
    $response = $this->postJson('/api/v1/auth/register', registerPayload());

    $response->assertCreated()
        ->assertJsonPath('data.user.name', 'Халид')
        ->assertJsonPath('data.user.email', 'client@gmail.com')
        ->assertJsonPath('data.user.phone', '+998901234567')
        ->assertJsonPath('data.user.locale', 'ru')
        ->assertJsonPath('data.user.theme', 'system')
        ->assertJsonPath('data.user.roles', ['client'])
        ->assertJsonPath('data.user.is_staff', false)
        ->assertJsonPath('data.token_type', 'Bearer')
        ->assertJsonStructure(['data' => ['user' => ['id'], 'token', 'expires_at']])
        ->assertJsonMissingPath('data.user.password');

    $user = User::query()->where('email', 'client@gmail.com')->firstOrFail();

    expect($user->hasRole(Role::Client))->toBeTrue()
        ->and($user->tokens()->first()->name)->toBe('Pest');

    $this->withToken($response->json('data.token'))
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);
});

it('allows registration without phone', function () {
    $this->postJson('/api/v1/auth/register', registerPayload(['phone' => null]))
        ->assertCreated()
        ->assertJsonPath('data.user.phone', null);
});

it('rejects an already registered email in any letter case', function () {
    User::factory()->create(['email' => 'client@gmail.com']);

    $this->postJson('/api/v1/auth/register', registerPayload(['email' => 'CLIENT@gmail.com']))
        ->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_ERROR')
        ->assertJsonPath('errors.email.0', 'Этот email уже зарегистрирован.');
});

it('validates registration fields', function (array $payload, string $field) {
    $this->postJson('/api/v1/auth/register', registerPayload($payload))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'missing name' => [['name' => ''], 'name'],
    'missing email' => [['email' => ''], 'email'],
    'invalid email' => [['email' => 'not-an-email'], 'email'],
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
