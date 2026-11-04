<?php

use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\PersonalAccessToken;

const CALLBACK = 'https://shop.test/api/auth/google/callback';

function fakeGoogle(array $profile = []): void
{
    Http::preventStrayRequests();
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'google-access', 'expires_in' => 3600]),
        'openidconnect.googleapis.com/*' => Http::response([
            'sub' => 'google-user-1',
            'email' => 'buyer@gmail.com',
            'email_verified' => true,
            'name' => 'Сухроб Каримов',
            ...$profile,
        ]),
    ]);
}

function signInWithGoogle()
{
    return test()->postJson('/api/v1/auth/google', ['code' => 'google-code', 'redirect_uri' => CALLBACK, 'device_name' => 'Chrome Windows']);
}

beforeEach(function () {
    config(['services.google.client_id' => 'client-id', 'services.google.client_secret' => 'client-secret']);
});

it('sends the visitor to Google with the site address and the check string', function () {
    $url = $this->getJson('/api/v1/auth/google/url?'.http_build_query(['redirect_uri' => CALLBACK, 'state' => 'random-state']))
        ->assertOk()
        ->json('data.url');

    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

    expect($url)->toStartWith('https://accounts.google.com/')
        ->and($query['client_id'])->toBe('client-id')
        ->and($query['redirect_uri'])->toBe(CALLBACK)
        ->and($query['state'])->toBe('random-state')
        ->and($query['scope'])->toBe('openid email profile')
        ->and($url)->not->toContain('client-secret');
});

it('says so when the keys are not on the server yet', function () {
    config(['services.google.client_id' => null]);

    $this->getJson('/api/v1/auth/google/url?'.http_build_query(['redirect_uri' => CALLBACK, 'state' => 'x']))
        ->assertStatus(503)
        ->assertJsonPath('code', 'GOOGLE_NOT_CONFIGURED');
});

it('tells the site whether the button should be shown', function () {
    $this->getJson('/api/v1/settings/public')->assertJsonPath('data.auth.google', true);

    config(['services.google.client_secret' => null]);

    $this->getJson('/api/v1/settings/public')->assertJsonPath('data.auth.google', false);
});

it('registers a new customer in one step', function () {
    fakeGoogle();

    $response = signInWithGoogle()
        ->assertOk()
        ->assertJsonPath('data.user.email', 'buyer@gmail.com')
        ->assertJsonPath('data.user.name', 'Сухроб Каримов')
        ->assertJsonPath('data.user.roles', ['client']);

    $user = User::query()->where('email', 'buyer@gmail.com')->sole();

    expect($user->google_id)->toBe('google-user-1')
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->phone)->toBeNull()
        ->and($response->json('data.refresh_token'))->not->toBeNull();

    app('auth')->forgetGuards();
    $this->withToken($response->json('data.token'))->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $user->id);
});

it('takes the name from the address when Google gives none', function () {
    fakeGoogle(['name' => '']);

    signInWithGoogle()->assertOk()->assertJsonPath('data.user.name', 'buyer');
});

it('signs an existing customer in and keeps their password', function () {
    fakeGoogle();
    $user = User::factory()->client()->create(['email' => 'buyer@gmail.com', 'email_verified_at' => now(), 'password' => Hash::make('Secret-password-1')]);

    signInWithGoogle()->assertOk()->assertJsonPath('data.user.id', $user->id);

    expect(User::query()->where('email', 'buyer@gmail.com')->count())->toBe(1)
        ->and($user->fresh()->google_id)->toBe('google-user-1')
        ->and(Hash::check('Secret-password-1', $user->fresh()->password))->toBeTrue();
});

it('finds the person by their Google account even after the address changed', function () {
    fakeGoogle(['email' => 'new-address@gmail.com']);
    $user = User::factory()->client()->create(['email' => 'old-address@gmail.com', 'google_id' => 'google-user-1']);

    signInWithGoogle()->assertOk()->assertJsonPath('data.user.id', $user->id);
});

it('ends the password of an account that never confirmed this address', function () {
    fakeGoogle();
    $stranger = User::factory()->client()->create(['email' => 'buyer@gmail.com', 'email_verified_at' => null, 'password' => Hash::make('Stranger-password-1')]);
    $strangerToken = $stranger->createToken('stranger');

    signInWithGoogle()->assertOk();

    expect(Hash::check('Stranger-password-1', $stranger->fresh()->password))->toBeFalse()
        ->and($stranger->fresh()->email_verified_at)->not->toBeNull()
        ->and(PersonalAccessToken::query()->find($strangerToken->accessToken->getKey()))->toBeNull();
});

it('never lets the shop team in through Google', function (string $role) {
    fakeGoogle();
    User::factory()->{$role}()->create(['email' => 'buyer@gmail.com']);

    signInWithGoogle()->assertForbidden()->assertJsonPath('code', 'STAFF_PASSWORD_ONLY');

    expect(PersonalAccessToken::query()->count())->toBe(0);
})->with(['admin', 'manager']);

it('does not let a blocked customer in', function () {
    fakeGoogle();
    User::factory()->client()->create(['email' => 'buyer@gmail.com', 'blocked_at' => now()]);

    signInWithGoogle()->assertForbidden()->assertJsonPath('code', 'ACCOUNT_BLOCKED');
});

it('refuses an address Google has not confirmed', function () {
    fakeGoogle(['email_verified' => false]);

    signInWithGoogle()->assertUnprocessable()->assertJsonPath('code', 'GOOGLE_SIGN_IN_FAILED');

    expect(User::query()->where('email', 'buyer@gmail.com')->exists())->toBeFalse();
});

it('refuses the same address under another Google account', function () {
    fakeGoogle(['sub' => 'someone-else']);
    User::factory()->client()->create(['email' => 'buyer@gmail.com', 'google_id' => 'google-user-1']);

    signInWithGoogle()->assertUnprocessable()->assertJsonPath('code', 'GOOGLE_SIGN_IN_FAILED');
});

it('reports a code Google does not accept', function () {
    Http::preventStrayRequests();
    Http::fake(['oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400)]);

    signInWithGoogle()->assertUnprocessable()->assertJsonPath('code', 'GOOGLE_SIGN_IN_FAILED');
});

it('lets a deleted account start again with the same Google account', function () {
    fakeGoogle();
    $user = User::factory()->client()->create(['email' => 'buyer@gmail.com', 'google_id' => 'google-user-1', 'email_verified_at' => now(), 'password' => Hash::make('Secret-password-1')]);

    $this->withToken($user->createToken('Pest')->plainTextToken)
        ->deleteJson('/api/v1/me', ['password' => 'Secret-password-1'])
        ->assertSuccessful();

    app('auth')->forgetGuards();
    $this->flushHeaders();

    expect(signInWithGoogle()->assertOk()->json('data.user.id'))->not->toBe($user->id);
});
