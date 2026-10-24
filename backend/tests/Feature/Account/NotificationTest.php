<?php

use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Notifications\OrderStatusChangedNotification;
use App\Modules\User\Models\User;

beforeEach(function () {
    $this->user = User::factory()->client()->create();
    $this->token = $this->user->createToken('Pest')->plainTextToken;
    $this->order = Order::factory()->for($this->user)->create();
});

function notifyAbout(object $test, OrderStatus $status): void
{
    $test->user->notify(new OrderStatusChangedNotification($test->order, $status));
}

it('lists my notifications with the unread count', function () {
    notifyAbout($this, OrderStatus::Confirmed);
    $this->travel(1)->minute();
    notifyAbout($this, OrderStatus::Delivering);
    User::factory()->create()->notify(new OrderStatusChangedNotification($this->order, OrderStatus::Confirmed));

    $this->withToken($this->token)->getJson('/api/v1/me/notifications')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.unread_count', 2)
        ->assertJsonPath('data.0.type', 'order_status_changed')
        ->assertJsonPath('data.0.title', "Заказ {$this->order->number}: В пути")
        ->assertJsonPath('data.0.order_number', $this->order->number)
        ->assertJsonPath('data.0.is_read', false);
});

it('marks one or all notifications as read', function () {
    notifyAbout($this, OrderStatus::Confirmed);
    notifyAbout($this, OrderStatus::Assembling);
    $id = $this->user->notifications()->first()->id;

    $this->withToken($this->token)->postJson("/api/v1/me/notifications/{$id}/read")->assertNoContent();
    $this->withToken($this->token)->getJson('/api/v1/me/notifications?unread=1')
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('meta.unread_count', 1);

    $this->withToken($this->token)->postJson('/api/v1/me/notifications/read-all')->assertNoContent();

    expect($this->user->unreadNotifications()->count())->toBe(0);
});

it('does not touch notifications of other users', function () {
    $other = User::factory()->create();
    $other->notify(new OrderStatusChangedNotification($this->order, OrderStatus::Confirmed));

    $this->withToken($this->token)->postJson('/api/v1/me/notifications/'.$other->notifications()->first()->id.'/read')
        ->assertNotFound();
});
