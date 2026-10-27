<?php

use App\Modules\Account\Notifications\EmailChangeCodeNotification;
use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Favorite\Models\Favorite;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->user = User::factory()->client()->create([
        'name' => 'Халид', 'email' => 'client@gmail.com', 'phone' => '+998901234567', 'password' => 'secret123',
    ]);
    $this->token = $this->user->createToken('Phone')->plainTextToken;
});

it('closes all /me routes for guests', function (string $method, string $uri) {
    $this->json($method, $uri)->assertUnauthorized();
})->with([
    ['GET', '/api/v1/me/dashboard'], ['PATCH', '/api/v1/me'], ['DELETE', '/api/v1/me'], ['PUT', '/api/v1/me/password'],
    ['GET', '/api/v1/me/addresses'], ['GET', '/api/v1/me/notifications'], ['GET', '/api/v1/me/sessions'],
]);

it('shows the dashboard', function () {
    Order::factory()->for($this->user)->status(OrderStatus::Completed)->create(['total' => 500000]);
    Order::factory()->for($this->user)->status(OrderStatus::Completed)->create(['total' => 250000]);
    $last = Order::factory()->for($this->user)->create(['total' => 100000]);
    Order::factory()->create(); // someone else's
    Favorite::query()->insert(['user_id' => $this->user->id, 'product_id' => Product::factory()->create()->id]);
    CartItem::factory()->create(['user_id' => $this->user->id]);

    $this->withToken($this->token)->getJson('/api/v1/me/dashboard')
        ->assertOk()
        ->assertJsonPath('data.user.name', 'Халид')
        ->assertJsonPath('data.orders', ['total' => 3, 'active' => 1, 'completed' => 2, 'spent' => 750000])
        ->assertJsonPath('data.last_order.number', $last->number)
        ->assertJsonPath('data.favorites_count', 1)
        ->assertJsonPath('data.cart_items_count', 1)
        ->assertJsonPath('data.unread_notifications_count', 0);
});

it('updates only the sent profile fields', function () {
    $this->withToken($this->token)->patchJson('/api/v1/me', ['name' => ' Халид Жабиров ', 'theme' => 'dark'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Халид Жабиров')
        ->assertJsonPath('data.theme', 'dark')
        ->assertJsonPath('data.phone', '+998901234567')
        ->assertJsonPath('data.locale', 'ru');
});

it('changes and removes the phone, one phone per account', function () {
    User::factory()->create(['phone' => '+998907771122']);

    $this->withToken($this->token)->patchJson('/api/v1/me', ['phone' => '+998 90 777 11 22'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.phone.0', 'Этот номер телефона уже привязан к другому аккаунту.');

    $this->withToken($this->token)->patchJson('/api/v1/me', ['phone' => '+998 90 123-45-67'])->assertOk(); // own number
    $this->withToken($this->token)->patchJson('/api/v1/me', ['phone' => '+998 90 555 12 34'])
        ->assertOk()->assertJsonPath('data.phone', '+998905551234');
    $this->withToken($this->token)->patchJson('/api/v1/me', ['phone' => null])
        ->assertOk()->assertJsonPath('data.phone', null);
});

it('validates profile fields', function (array $payload, string $field) {
    $this->withToken($this->token)->patchJson('/api/v1/me', $payload)->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    [['name' => 'x'], 'name'],
    [['locale' => 'en'], 'locale'],
    [['theme' => 'pink'], 'theme'],
    [['phone' => '12'], 'phone'],
]);

it('changes the password and signs out other devices only', function () {
    $laptop = $this->user->createToken('Laptop')->plainTextToken;

    $this->withToken($this->token)->putJson('/api/v1/me/password', [
        'current_password' => 'secret123', 'password' => 'newSecret123', 'password_confirmation' => 'newSecret123',
    ])->assertOk();

    expect(Hash::check('newSecret123', $this->user->refresh()->password))->toBeTrue();

    $this->app['auth']->forgetGuards();
    $this->withToken($this->token)->getJson('/api/v1/auth/me')->assertOk();
    $this->app['auth']->forgetGuards();
    $this->withToken($laptop)->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('rejects a wrong current password or the same new password', function () {
    $this->withToken($this->token)->putJson('/api/v1/me/password', [
        'current_password' => 'wrong-pass1', 'password' => 'newSecret123', 'password_confirmation' => 'newSecret123',
    ])->assertUnprocessable()->assertJsonPath('errors.current_password.0', 'Неверный текущий пароль.');

    $this->withToken($this->token)->putJson('/api/v1/me/password', [
        'current_password' => 'secret123', 'password' => 'secret123', 'password_confirmation' => 'secret123',
    ])->assertUnprocessable()->assertJsonValidationErrors('password');
});

it('changes the email with a code sent to the new address', function () {
    Notification::fake();

    $this->withToken($this->token)->postJson('/api/v1/me/email/send-code', ['email' => 'New@Gmail.com'])->assertAccepted();

    $code = null;
    Notification::assertSentOnDemand(EmailChangeCodeNotification::class,
        function ($notification, $channels, AnonymousNotifiable $notifiable) use (&$code) {
            $code = $notification->code;

            return $notifiable->routes['mail'] === 'new@gmail.com';
        });

    $this->withToken($this->token)->putJson('/api/v1/me/email', ['email' => 'new@gmail.com', 'code' => $code, 'password' => 'wrong-pass1'])
        ->assertUnprocessable()->assertJsonValidationErrors('password');
    $this->withToken($this->token)->putJson('/api/v1/me/email', ['email' => 'new@gmail.com', 'code' => '000000', 'password' => 'secret123'])
        ->assertUnprocessable()->assertJsonPath('code', 'INVALID_VERIFICATION_CODE');
    $this->withToken($this->token)->putJson('/api/v1/me/email', ['email' => 'new@gmail.com', 'code' => $code, 'password' => 'secret123'])
        ->assertOk()->assertJsonPath('data.email', 'new@gmail.com');

    $this->postJson('/api/v1/auth/login', ['email' => 'new@gmail.com', 'password' => 'secret123'])->assertOk();
});

it('does not send an email change code to a taken email', function () {
    Notification::fake();
    User::factory()->create(['email' => 'taken@gmail.com']);

    $this->withToken($this->token)->postJson('/api/v1/me/email/send-code', ['email' => 'taken@gmail.com'])
        ->assertUnprocessable()->assertJsonValidationErrors('email');

    Notification::assertNothingSent();
});

it('deletes the account and releases email and phone', function () {
    Address::factory()->for($this->user)->create();
    CartItem::factory()->create(['user_id' => $this->user->id]);
    $order = Order::factory()->for($this->user)->status(OrderStatus::Completed)->create();

    $this->withToken($this->token)->deleteJson('/api/v1/me', ['password' => 'wrong-pass1'])->assertUnprocessable();
    $this->withToken($this->token)->deleteJson('/api/v1/me', ['password' => 'secret123'])->assertNoContent();

    $deleted = User::withTrashed()->find($this->user->id);

    expect($deleted->trashed())->toBeTrue()
        ->and($deleted->email)->toBe("deleted-{$this->user->id}@deleted.invalid")
        ->and($deleted->phone)->toBeNull()
        ->and($deleted->tokens()->count())->toBe(0)
        ->and(Address::query()->count())->toBe(0)
        ->and(CartItem::query()->count())->toBe(0)
        ->and($order->fresh())->not->toBeNull();

    $this->postJson('/api/v1/auth/login', ['email' => 'client@gmail.com', 'password' => 'secret123'])->assertUnauthorized();
    expect(User::factory()->create(['email' => 'client@gmail.com', 'phone' => '+998901234567'])->exists)->toBeTrue();
});

it('does not delete an account with active orders', function () {
    Order::factory()->for($this->user)->status(OrderStatus::Delivering)->create();

    $this->withToken($this->token)->deleteJson('/api/v1/me', ['password' => 'secret123'])
        ->assertConflict()
        ->assertJsonPath('code', 'ACCOUNT_HAS_ACTIVE_ORDERS');
});

it('never lets an admin or a manager delete their own account', function (string $role) {
    $staff = User::factory()->{$role}()->create(['password' => 'secret123']);

    $this->withToken($staff->createToken('Phone')->plainTextToken)->deleteJson('/api/v1/me', ['password' => 'secret123'])
        ->assertForbidden()
        ->assertJsonPath('code', 'STAFF_ACCOUNT_CANNOT_BE_DELETED');

    expect($staff->fresh()->trashed())->toBeFalse();
})->with(['admin', 'manager']);

it('lists devices and signs out a chosen one', function () {
    $laptop = $this->user->createToken('Laptop');

    $response = $this->withToken($this->token)->getJson('/api/v1/me/sessions')->assertOk()->assertJsonCount(2, 'data');

    expect(collect($response->json('data'))->firstWhere('is_current', true)['device'])->toBe('Phone');

    $this->withToken($this->token)->deleteJson("/api/v1/me/sessions/{$laptop->accessToken->id}")->assertNoContent();
    $foreign = User::factory()->create()->createToken('X')->accessToken->id;
    $this->withToken($this->token)->deleteJson("/api/v1/me/sessions/{$foreign}")->assertNotFound();

    expect($this->user->tokens()->count())->toBe(1);
});
