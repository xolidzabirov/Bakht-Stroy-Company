<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Models\Conversation;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Customer ↔ shop chat: sending, files, quotes, product / order cards, read marks, edit and delete.
 */
beforeEach(function () {
    Storage::fake('public');
    $this->client = User::factory()->client()->create()->fresh();
    $this->manager = User::factory()->manager()->create()->fresh();
});

function chatAs(object $test, User $user): object
{
    return $test->actingAs($user, 'sanctum');
}

it('creates the conversation on first open and shows the shop as the contact', function () {
    chatAs($this, $this->client)->getJson('/api/v1/chat')
        ->assertOk()
        ->assertJsonPath('data.manager.name', 'Bakht Stroy')
        ->assertJsonPath('data.manager.is_assigned', false)
        ->assertJsonPath('data.unread_count', 0)
        ->assertJsonPath('data.limits.max_files', 5);

    expect(Conversation::query()->where('user_id', $this->client->id)->count())->toBe(1);
    expect($this->client->fresh()->last_seen_at)->not->toBeNull();
});

it('lets the customer write and the manager reply, assigning the manager', function () {
    chatAs($this, $this->client)->postJson('/api/v1/chat/messages', ['body' => '  Есть цемент М500?  '])
        ->assertCreated()
        ->assertJsonPath('data.body', 'Есть цемент М500?')
        ->assertJsonPath('data.from_staff', false)
        ->assertJsonPath('data.read_at', null);

    $conversation = Conversation::query()->firstOrFail();

    chatAs($this, $this->manager)->getJson('/api/v1/admin/chats')
        ->assertOk()
        ->assertJsonPath('data.0.client.name', $this->client->name)
        ->assertJsonPath('data.0.unread_count', 1)
        ->assertJsonPath('meta.unread_conversations', 1);

    chatAs($this, $this->manager)->postJson("/api/v1/admin/chats/{$conversation->id}/messages", ['body' => 'Да, 75 сомони за мешок'])
        ->assertCreated()
        ->assertJsonPath('data.from_staff', true)
        ->assertJsonPath('data.sender.name', $this->manager->name);

    expect($conversation->fresh()->manager_id)->toBe($this->manager->id);

    chatAs($this, $this->client)->getJson('/api/v1/chat')
        ->assertJsonPath('data.manager.name', $this->manager->name)
        ->assertJsonPath('data.manager.is_online', true)
        ->assertJsonPath('data.unread_count', 1);
});

it('marks the other side messages as read (double tick)', function () {
    $conversation = Conversation::of($this->client);
    $mine = $conversation->messages()->create(['sender_id' => $this->client->id, 'from_staff' => false, 'body' => 'Привет']);
    $reply = $conversation->messages()->create(['sender_id' => $this->manager->id, 'from_staff' => true, 'body' => 'Здравствуйте']);

    chatAs($this, $this->client)->postJson('/api/v1/chat/read')->assertOk()->assertJsonPath('data.marked', 1);

    expect($reply->fresh()->read_at)->not->toBeNull()
        ->and($mine->fresh()->read_at)->toBeNull();

    chatAs($this, $this->manager)->postJson("/api/v1/admin/chats/{$conversation->id}/read")->assertJsonPath('data.marked', 1);
    expect($mine->fresh()->read_at)->not->toBeNull();
});

it('pages through the history from the newest', function () {
    $conversation = Conversation::of($this->client);
    foreach (range(1, 35) as $i) {
        $conversation->messages()->create(['sender_id' => $this->client->id, 'from_staff' => false, 'body' => "#{$i}"]);
    }

    $first = chatAs($this, $this->client)->getJson('/api/v1/chat/messages')
        ->assertOk()
        ->assertJsonCount(30, 'data')
        ->assertJsonPath('data.29.body', '#35')
        ->assertJsonPath('meta.has_more', true);

    chatAs($this, $this->client)->getJson('/api/v1/chat/messages?before_id='.$first->json('data.0.id'))
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('data.0.body', '#1')
        ->assertJsonPath('meta.has_more', false);
});

it('accepts photos and documents and rejects other files', function () {
    chatAs($this, $this->client)->post('/api/v1/chat/messages', [
        'attachments' => [UploadedFile::fake()->image('объект.jpg', 1200, 900), UploadedFile::fake()->create('Смета.pdf', 300, 'application/pdf')],
    ], ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonCount(2, 'data.attachments')
        ->assertJsonPath('data.attachments.0.is_image', true)
        ->assertJsonPath('data.attachments.1.is_image', false)
        ->assertJsonPath('data.attachments.1.name', 'Смета.pdf');

    $media = ChatMessage::query()->firstOrFail()->getFirstMedia(ChatMessage::ATTACHMENTS);
    expect(str_replace(DIRECTORY_SEPARATOR, '/', $media->getPath()))->toContain("chat/{$media->uuid}/");

    chatAs($this, $this->client)->post('/api/v1/chat/messages', ['attachments' => [UploadedFile::fake()->create('virus.exe', 10)]], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('attachments.0');

    chatAs($this, $this->client)->postJson('/api/v1/chat/messages', ['body' => '   '])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('body');
});

it('quotes only messages of the same conversation and links only own orders', function () {
    $conversation = Conversation::of($this->client);
    $quoted = $conversation->messages()->create(['sender_id' => $this->manager->id, 'from_staff' => true, 'body' => 'Доставка завтра']);
    $foreign = Conversation::of(User::factory()->client()->create())->messages()->create(['sender_id' => $this->manager->id, 'from_staff' => true, 'body' => 'Чужое']);
    $order = Order::factory()->for($this->client)->create();
    $foreignOrder = Order::factory()->create();
    $product = Product::factory()->create();

    chatAs($this, $this->client)->postJson('/api/v1/chat/messages', [
        'body' => 'Во сколько?', 'reply_to_id' => $quoted->id, 'order_number' => strtolower($order->number), 'product_id' => $product->id,
    ])
        ->assertCreated()
        ->assertJsonPath('data.reply_to.body', 'Доставка завтра')
        ->assertJsonPath('data.order.number', $order->number)
        ->assertJsonPath('data.product.slug', $product->slug);

    chatAs($this, $this->client)->postJson('/api/v1/chat/messages', ['body' => 'x', 'reply_to_id' => $foreign->id])
        ->assertUnprocessable()->assertJsonValidationErrors('reply_to_id');

    chatAs($this, $this->client)->postJson('/api/v1/chat/messages', ['order_number' => $foreignOrder->number])
        ->assertUnprocessable()->assertJsonValidationErrors('order_number');
});

it('edits and deletes only own messages', function () {
    $conversation = Conversation::of($this->client);
    $mine = $conversation->messages()->create(['sender_id' => $this->client->id, 'from_staff' => false, 'body' => 'Цемнт']);
    $theirs = $conversation->messages()->create(['sender_id' => $this->manager->id, 'from_staff' => true, 'body' => 'Ответ']);

    chatAs($this, $this->client)->patchJson("/api/v1/chat/messages/{$mine->id}", ['body' => 'Цемент'])
        ->assertOk()
        ->assertJsonPath('data.body', 'Цемент')
        ->assertJsonPath('data.is_edited', true);

    chatAs($this, $this->client)->patchJson("/api/v1/chat/messages/{$theirs->id}", ['body' => 'взлом'])->assertForbidden();
    chatAs($this, $this->client)->deleteJson("/api/v1/chat/messages/{$theirs->id}")->assertForbidden();

    chatAs($this, $this->client)->deleteJson("/api/v1/chat/messages/{$mine->id}")
        ->assertOk()
        ->assertJsonPath('data.is_deleted', true)
        ->assertJsonPath('data.body', null);

    chatAs($this, $this->client)->patchJson("/api/v1/chat/messages/{$mine->id}", ['body' => 'снова'])->assertUnprocessable();
});

it('allows editing only within 48 hours', function () {
    $message = Conversation::of($this->client)->messages()->create(['sender_id' => $this->client->id, 'from_staff' => false, 'body' => 'Старое']);

    $this->travel(49)->hours();

    chatAs($this, $this->client)->patchJson("/api/v1/chat/messages/{$message->id}", ['body' => 'Новое'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('body');
});

it('never shows another customer conversation', function () {
    $other = User::factory()->client()->create();
    $theirMessage = Conversation::of($other)->messages()->create(['sender_id' => $other->id, 'from_staff' => false, 'body' => 'Секрет']);

    chatAs($this, $this->client)->getJson('/api/v1/chat/messages')->assertOk()->assertJsonCount(0, 'data');
    chatAs($this, $this->client)->patchJson("/api/v1/chat/messages/{$theirMessage->id}", ['body' => 'x'])->assertNotFound();
    chatAs($this, $this->client)->getJson('/api/v1/admin/chats')->assertForbidden();
});

it('requires signing in', function () {
    $this->getJson('/api/v1/chat')->assertUnauthorized();
});

it('lists unread conversations first and finds them by phone', function () {
    $quiet = User::factory()->client()->create(['name' => 'Тихий']);
    $waiting = User::factory()->client()->create(['name' => 'Ждёт', 'phone' => '+992901112233']);

    Conversation::of($quiet)->messages()->create(['sender_id' => $quiet->id, 'from_staff' => false, 'body' => 'a'])->forceFill(['read_at' => now()])->save();
    Conversation::of($quiet)->update(['last_message_at' => now()]);
    Conversation::of($waiting)->messages()->create(['sender_id' => $waiting->id, 'from_staff' => false, 'body' => 'b']);
    Conversation::of($waiting)->update(['last_message_at' => now()->subHour()]);

    chatAs($this, $this->manager)->getJson('/api/v1/admin/chats')
        ->assertJsonPath('data.0.client.name', 'Ждёт')
        ->assertJsonPath('data.1.client.name', 'Тихий');

    chatAs($this, $this->manager)->getJson('/api/v1/admin/chats?search=111 22')->assertJsonCount(1, 'data')->assertJsonPath('data.0.client.name', 'Ждёт');
    chatAs($this, $this->manager)->getJson('/api/v1/admin/chats?search=Тих')->assertJsonCount(1, 'data');
    chatAs($this, $this->manager)->getJson('/api/v1/admin/chats?filter=unread')->assertJsonCount(1, 'data');
});

it('shows the customer card with orders', function () {
    Order::factory()->for($this->client)->count(2)->create();
    $conversation = Conversation::of($this->client);

    chatAs($this, $this->manager)->getJson("/api/v1/admin/chats/{$conversation->id}")
        ->assertOk()
        ->assertJsonPath('data.client.id', $this->client->id)
        ->assertJsonPath('data.orders_count', 2)
        ->assertJsonCount(2, 'data.recent_orders');
});

it('lets only the admin assign a conversation to a staff member', function () {
    $admin = User::factory()->admin()->create()->fresh();
    $conversation = Conversation::of($this->client);

    chatAs($this, $this->manager)->patchJson("/api/v1/admin/chats/{$conversation->id}/manager", ['manager_id' => $this->manager->id])->assertForbidden();

    chatAs($this, $admin)->patchJson("/api/v1/admin/chats/{$conversation->id}/manager", ['manager_id' => $this->client->id])
        ->assertUnprocessable()->assertJsonValidationErrors('manager_id');

    chatAs($this, $admin)->patchJson("/api/v1/admin/chats/{$conversation->id}/manager", ['manager_id' => $this->manager->id])->assertOk();
    expect($conversation->fresh()->manager_id)->toBe($this->manager->id);

    chatAs($this, $admin)->getJson('/api/v1/admin/chats/staff')
        ->assertOk()
        ->assertJsonFragment(['id' => $this->manager->id])
        ->assertJsonMissing(['id' => $this->client->id]);
});
