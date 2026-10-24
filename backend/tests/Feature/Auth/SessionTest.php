<?php

use App\Modules\User\Models\User;

function loginToken(User $user, string $device = 'Pest'): string
{
    return $user->createToken($device)->plainTextToken;
}

it('returns the current user', function () {
    $user = User::factory()->admin()->create();

    $this->withToken(loginToken($user))
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.roles', ['admin'])
        ->assertJsonPath('data.is_staff', true);
});

it('requires a token for protected routes', function (string $method, string $uri) {
    $this->json($method, $uri)
        ->assertUnauthorized()
        ->assertJsonPath('code', 'UNAUTHENTICATED');
})->with([
    ['GET', '/api/v1/auth/me'],
    ['POST', '/api/v1/auth/logout'],
    ['POST', '/api/v1/auth/logout-all'],
]);

it('rejects an invalid token', function () {
    $this->withToken('1|invalid-token')
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

it('logs out only the current device', function () {
    $user = User::factory()->client()->create();
    $phoneToken = loginToken($user, 'Phone');
    $laptopToken = loginToken($user, 'Laptop');

    $this->withToken($phoneToken)->postJson('/api/v1/auth/logout')->assertNoContent();

    $this->app['auth']->forgetGuards();
    $this->withToken($phoneToken)->getJson('/api/v1/auth/me')->assertUnauthorized();

    $this->app['auth']->forgetGuards();
    $this->withToken($laptopToken)->getJson('/api/v1/auth/me')->assertOk();
});

it('logs out from all devices', function () {
    $user = User::factory()->client()->create();
    $phoneToken = loginToken($user, 'Phone');
    loginToken($user, 'Laptop');

    $this->withToken($phoneToken)->postJson('/api/v1/auth/logout-all')->assertNoContent();

    expect($user->tokens()->count())->toBe(0);
});

it('rejects tokens of a user blocked after login', function () {
    $user = User::factory()->client()->create();
    $token = loginToken($user);

    $user->forceFill(['blocked_at' => now()])->save();

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertForbidden()
        ->assertJsonPath('code', 'ACCOUNT_BLOCKED');

    expect($user->tokens()->count())->toBe(0);
});

it('rejects expired tokens', function () {
    $user = User::factory()->client()->create();
    $token = $user->createToken('Old', ['*'], now()->subMinute())->plainTextToken;

    $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
});
