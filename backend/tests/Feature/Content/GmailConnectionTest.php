<?php

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Content\Support\GmailConnection;
use App\Modules\User\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

const GMAIL_SCOPE = 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.send';
const MAIL_CALLBACK = 'https://shop.test/api/auth/google/callback';

function fakeGmail(): void
{
    Http::preventStrayRequests();
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'gmail-access', 'expires_in' => 3600]),
        'gmail.googleapis.com/*' => Http::response(['id' => 'sent-1']),
        'oauth2.googleapis.com/revoke' => Http::response([]),
    ]);
}

/** The letter Gmail received, as text. */
function sentLetter(): string
{
    $request = Http::recorded(fn (Request $request) => str_contains($request->url(), 'gmail.googleapis.com'))->last()[0];

    return (string) base64_decode(strtr($request['raw'], '-_', '+/'));
}

beforeEach(function () {
    config([
        'services.google.client_id' => 'client-id',
        'services.google.client_secret' => 'client-secret',
        'mail.default' => 'gmail',
    ]);
    $this->adminToken = User::factory()->admin()->create()->createToken('Pest')->plainTextToken;
});

it('is for the administrator only', function (string $method, string $uri) {
    $this->json($method, $uri)->assertUnauthorized();

    $managerToken = User::factory()->manager()->create()->createToken('Pest')->plainTextToken;
    app('auth')->forgetGuards();

    $this->withToken($managerToken)->json($method, $uri)->assertForbidden();
})->with([
    ['GET', '/api/v1/admin/mail'],
    ['GET', '/api/v1/admin/mail/google/url?redirect_uri=https%3A%2F%2Fa.test&state=x'],
    ['POST', '/api/v1/admin/mail/google'],
    ['POST', '/api/v1/admin/mail/test'],
    ['DELETE', '/api/v1/admin/mail/google'],
]);

it('asks Google for a long-lived permission to send', function () {
    $url = $this->withToken($this->adminToken)
        ->getJson('/api/v1/admin/mail/google/url?'.http_build_query(['redirect_uri' => MAIL_CALLBACK, 'state' => 'random-state']))
        ->assertOk()
        ->json('data.url');

    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

    expect($query['scope'])->toContain('https://www.googleapis.com/auth/gmail.send')
        ->and($query['access_type'])->toBe('offline')
        ->and($query['prompt'])->toBe('consent')
        ->and($query['state'])->toBe('random-state');
});

it('connects the mailbox and keeps the token encrypted and private', function () {
    Http::preventStrayRequests();
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'first-access', 'refresh_token' => 'secret-refresh-token', 'scope' => GMAIL_SCOPE, 'expires_in' => 3600]),
        'openidconnect.googleapis.com/*' => Http::response(['sub' => '1', 'email' => 'shop@gmail.com', 'email_verified' => true]),
    ]);

    $this->withToken($this->adminToken)
        ->postJson('/api/v1/admin/mail/google', ['code' => 'google-code', 'redirect_uri' => MAIL_CALLBACK])
        ->assertOk()
        ->assertJsonPath('data.connected', true)
        ->assertJsonPath('data.email', 'shop@gmail.com')
        ->assertJsonPath('data.active', true);

    expect(json_encode(DB::table('settings')->get()))->not->toContain('secret-refresh-token');

    $public = $this->getJson('/api/v1/settings/public')->assertOk()->getContent();
    $admin = $this->withToken($this->adminToken)->getJson('/api/v1/admin/settings')->assertOk()->getContent();

    expect($public)->not->toContain('gmail')->not->toContain('shop@gmail.com')
        ->and($admin)->not->toContain('refresh_token');
});

it('does not connect when the person unticked sending on the page of Google', function (array $tokens) {
    Http::preventStrayRequests();
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'a', 'expires_in' => 3600, ...$tokens]),
        'openidconnect.googleapis.com/*' => Http::response(['sub' => '1', 'email' => 'shop@gmail.com', 'email_verified' => true]),
    ]);

    $this->withToken($this->adminToken)
        ->postJson('/api/v1/admin/mail/google', ['code' => 'google-code', 'redirect_uri' => MAIL_CALLBACK])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'GMAIL_CONNECT_FAILED');

    expect(app(GmailConnection::class)->isConnected())->toBeFalse();
})->with([
    'no permission to send' => [['refresh_token' => 'r', 'scope' => 'openid email']],
    'no long-lived token' => [['scope' => GMAIL_SCOPE]],
]);

it('sends a letter through Gmail from the connected address, in Russian', function () {
    fakeGmail();
    app(GmailConnection::class)->save('shop@gmail.com', 'refresh-token');

    Mail::raw('Код: 123456', fn ($message) => $message->to('buyer@gmail.com')->subject('Код регистрации'));

    $letter = sentLetter();

    expect($letter)->toContain('To: buyer@gmail.com')
        ->toContain('shop@gmail.com')
        ->toContain('Bakht Stroy Company')
        ->not->toContain('hello@example.com');

    Http::assertSent(fn (Request $request) => str_contains($request->url(), 'gmail.googleapis.com') && $request->hasHeader('Authorization', 'Bearer gmail-access'));
});

it('asks Google for a token once, not for every letter', function () {
    fakeGmail();
    app(GmailConnection::class)->save('shop@gmail.com', 'refresh-token');

    Mail::raw('Первое', fn ($message) => $message->to('a@gmail.com')->subject('1'));
    Mail::raw('Второе', fn ($message) => $message->to('b@gmail.com')->subject('2'));

    Http::assertSentCount(3);
});

it('sends the registration code through Gmail', function () {
    fakeGmail();
    app(GmailConnection::class)->save('shop@gmail.com', 'refresh-token');

    $this->postJson('/api/v1/auth/register/email', ['email' => 'buyer@gmail.com'])->assertSuccessful();

    expect(sentLetter())->toContain('buyer@gmail.com');
});

it('tells the visitor when the code could not be sent, and lets them try again at once', function () {
    Http::preventStrayRequests();

    $this->postJson('/api/v1/auth/register/email', ['email' => 'buyer@gmail.com'])
        ->assertStatus(503)
        ->assertJsonPath('code', 'EMAIL_NOT_DELIVERED');

    fakeGmail();
    app(GmailConnection::class)->save('shop@gmail.com', 'refresh-token');

    $this->postJson('/api/v1/auth/register/email', ['email' => 'buyer@gmail.com'])->assertSuccessful();
});

it('says the same about the password reset code', function () {
    Http::preventStrayRequests();
    $user = User::factory()->client()->create();

    $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
        ->assertStatus(503)
        ->assertJsonPath('code', 'EMAIL_NOT_DELIVERED');
});

it('and about the code for a new email', function () {
    Http::preventStrayRequests();
    $token = User::factory()->client()->create()->createToken('Pest')->plainTextToken;

    $this->withToken($token)->postJson('/api/v1/me/email/send-code', ['email' => 'new-address@gmail.com'])
        ->assertStatus(503)
        ->assertJsonPath('code', 'EMAIL_NOT_DELIVERED');
});

it('never loses an order because a letter could not be sent', function () {
    Http::preventStrayRequests();
    $user = User::factory()->client()->create();
    $product = Product::factory()->create(['stock' => 10]);
    CartItem::factory()->create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 2]);

    $this->withToken($user->createToken('Pest')->plainTextToken)
        ->postJson('/api/v1/orders', ['delivery_type' => 'pickup', 'payment_method' => 'cash', 'customer_phone' => '+992931234567'])
        ->assertCreated();

    expect($product->fresh()->stock)->toBe(8);
});

it('shows that Google took the access back', function () {
    Http::preventStrayRequests();
    Http::fake(['oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400)]);
    app(GmailConnection::class)->save('shop@gmail.com', 'refresh-token');

    $this->withToken($this->adminToken)->postJson('/api/v1/admin/mail/test')
        ->assertStatus(503)
        ->assertJsonPath('code', 'GMAIL_SEND_FAILED');

    $this->withToken($this->adminToken)->getJson('/api/v1/admin/mail')
        ->assertJsonPath('data.broken', true)
        ->assertJsonPath('data.email', 'shop@gmail.com');
});

it('sends a test letter to the connected mailbox', function () {
    fakeGmail();
    app(GmailConnection::class)->save('shop@gmail.com', 'refresh-token');

    $this->withToken($this->adminToken)->postJson('/api/v1/admin/mail/test')
        ->assertOk()
        ->assertJsonPath('data.sent_to', 'shop@gmail.com');

    expect(sentLetter())->toContain('To: shop@gmail.com');
});

it('disconnects and gives the permission back to Google', function () {
    fakeGmail();
    app(GmailConnection::class)->save('shop@gmail.com', 'refresh-token');

    $this->withToken($this->adminToken)->deleteJson('/api/v1/admin/mail/google')->assertNoContent();

    expect(app(GmailConnection::class)->isConnected())->toBeFalse();
    Http::assertSent(fn (Request $request) => str_contains($request->url(), '/revoke'));

    $this->withToken($this->adminToken)->getJson('/api/v1/admin/mail')
        ->assertJsonPath('data.connected', false)
        ->assertJsonPath('data.email', null);
});

it('reports when the server sends letters some other way', function () {
    config(['mail.default' => 'log']);

    $this->withToken($this->adminToken)->getJson('/api/v1/admin/mail')->assertJsonPath('data.active', false);
});
