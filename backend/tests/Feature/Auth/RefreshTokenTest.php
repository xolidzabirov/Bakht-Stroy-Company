<?php

use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

function signIn(User $user): array
{
    return test()->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Secret-password-1', 'device_name' => 'Chrome Windows'])
        ->assertOk()
        ->json('data');
}

function renew(string $refreshToken): array
{
    return test()->postJson('/api/v1/auth/refresh', ['refresh_token' => $refreshToken])->assertOk()->json('data');
}

/** Sanctum remembers the signed-in user between requests of one test: every call below must start clean. */
function me(string $token)
{
    app('auth')->forgetGuards();

    return test()->withToken($token)->getJson('/api/v1/auth/me');
}

beforeEach(function () {
    $this->customer = User::factory()->client()->create(['password' => Hash::make('Secret-password-1')]);
});

it('gives a refresh token at login and keeps only its hash', function () {
    $session = signIn($this->customer);

    expect($session['refresh_token'])->toStartWith(PersonalAccessToken::query()->sole()->getKey().'|')
        ->and($session['refresh_expires_at'])->not->toBeNull()
        ->and(PersonalAccessToken::query()->sole()->getAttribute('refresh_token'))
        ->toBe(hash('sha256', explode('|', $session['refresh_token'], 2)[1]));
});

it('works for the customer and for the administrator alike', function (string $role) {
    $user = User::factory()->{$role}()->create(['password' => Hash::make('Secret-password-1')]);

    $next = renew(signIn($user)['refresh_token']);

    expect($next['user']['email'])->toBe($user->email);
    me($next['token'])->assertOk()->assertJsonPath('data.id', $user->id);
})->with(['client', 'manager', 'admin']);

it('replaces an ended token and extends it for the next 24 hours', function () {
    $session = signIn($this->customer);

    $this->travel(25)->hours();
    me($session['token'])->assertUnauthorized();

    $next = renew($session['refresh_token']);

    me($next['token'])->assertOk();
    expect(now()->diffInMinutes($next['expires_at']))->toBeGreaterThan(1430.0)->toBeLessThanOrEqual(1440.0);

    // The same device in the sessions list, not a new one.
    expect(PersonalAccessToken::query()->count())->toBe(1);
});

it('keeps a session alive for many days while the visitor keeps coming', function () {
    $session = signIn($this->customer);

    foreach (range(1, 12) as $day) {
        $this->travel(25)->hours();
        $session = renew($session['refresh_token']);
    }

    me($session['token'])->assertOk();
});

it('stops working the old access token after a renewal', function () {
    $session = signIn($this->customer);
    $next = renew($session['refresh_token']);

    me($session['token'])->assertUnauthorized();
    me($next['token'])->assertOk();
});

it('asks for a new login after a long absence', function () {
    $session = signIn($this->customer);

    $this->travel(8)->days();

    $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $session['refresh_token']])
        ->assertUnauthorized()
        ->assertJsonPath('code', 'INVALID_REFRESH_TOKEN');
});

it('gives parallel requests the same new pair', function () {
    $session = signIn($this->customer);

    $first = renew($session['refresh_token']);
    $second = renew($session['refresh_token']);

    expect($second['token'])->toBe($first['token'])
        ->and($second['refresh_token'])->toBe($first['refresh_token']);
    me($second['token'])->assertOk();
});

it('survives an answer that never reached the browser', function () {
    $session = signIn($this->customer);

    renew($session['refresh_token']); // Lost: the browser still holds the old token.
    $this->travel(5)->minutes();

    $next = renew($session['refresh_token']);

    me($next['token'])->assertOk();
    me(renew($next['refresh_token'])['token'])->assertOk();
});

it('refuses a refresh token older than the previous one', function () {
    $first = signIn($this->customer);
    $second = renew($first['refresh_token']);

    $this->travel(5)->minutes();
    $third = renew($second['refresh_token']);

    $this->travel(5)->minutes();
    $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $first['refresh_token']])->assertUnauthorized();
    me($third['token'])->assertOk();
});

it('refuses made-up refresh tokens', function (string $token) {
    signIn($this->customer);

    $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $token])->assertUnauthorized();
})->with(['nonsense', '1|wrong-secret', '999|wrong-secret', '99999999999999999999|x']);

it('ends the refresh token together with the session', function () {
    $session = signIn($this->customer);

    me($session['token'])->assertOk();
    app('auth')->forgetGuards();
    $this->withToken($session['token'])->postJson('/api/v1/auth/logout')->assertNoContent();

    $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $session['refresh_token']])->assertUnauthorized();
});

it('does not renew a blocked account', function () {
    $session = signIn($this->customer);

    $this->customer->forceFill(['blocked_at' => now()])->save();

    $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $session['refresh_token']])->assertUnauthorized();
});

it('prunes only the sessions that cannot be renewed any more', function () {
    $active = signIn($this->customer);
    $this->travel(25)->hours(); // The access token has ended, the session has not.

    Artisan::call('shop:prune-sessions');

    expect(PersonalAccessToken::query()->count())->toBe(1);
    me(renew($active['refresh_token'])['token'])->assertOk();

    $this->travel(8)->days();
    Artisan::call('shop:prune-sessions');

    expect(PersonalAccessToken::query()->count())->toBe(0);
});
