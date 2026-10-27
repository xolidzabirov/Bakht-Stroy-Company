<?php

use App\Modules\Chat\Events\ChatMessageChanged;
use App\Modules\Chat\Events\ChatMessagesRead;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Models\Conversation;
use App\Modules\User\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * WebSocket channel access, event payloads and the Telegram ping to an absent manager.
 */
beforeEach(function () {
    $this->client = User::factory()->client()->create()->fresh();
    $this->manager = User::factory()->manager()->create(['phone' => '+992900000001'])->fresh();
});

/**
 * Channel auth needs a real (Pusher-protocol) broadcaster; the test env uses "null".
 */
function useReverbForChannels(): void
{
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb' => [
            'driver' => 'reverb', 'key' => 'test-key', 'secret' => 'test-secret', 'app_id' => '1',
            'options' => ['host' => 'localhost', 'port' => 8080, 'scheme' => 'http', 'useTLS' => false],
        ],
    ]);
    Broadcast::purge();
    Broadcast::forgetDrivers();
    require base_path('app/Modules/Chat/channels.php');
}

function authChannel(object $test, User $user, string $channel): object
{
    return $test->actingAs($user, 'sanctum')->postJson('/api/v1/broadcasting/auth', ['socket_id' => '1234.5678', 'channel_name' => "private-{$channel}"]);
}

it('opens a conversation channel only to its customer and the staff', function () {
    useReverbForChannels();
    $mine = Conversation::of($this->client);
    $other = Conversation::of(User::factory()->client()->create());

    authChannel($this, $this->client, "chat.{$mine->id}")->assertOk()->assertJsonStructure(['auth']);
    authChannel($this, $this->client, "chat.{$other->id}")->assertForbidden();
    authChannel($this, $this->client, 'chat.staff')->assertForbidden();
    authChannel($this, $this->manager, "chat.{$other->id}")->assertOk();
    authChannel($this, $this->manager, 'chat.staff')->assertOk();
});

it('broadcasts messages and read marks to the conversation and the inbox', function () {
    $conversation = Conversation::of($this->client);
    $message = $conversation->messages()->create(['sender_id' => $this->client->id, 'from_staff' => false, 'body' => 'Привет'])->load(ChatMessage::RELATIONS);

    $sent = new ChatMessageChanged($message, created: true);
    expect($sent->broadcastAs())->toBe('message.sent')
        ->and(array_map(fn ($channel) => $channel->name, $sent->broadcastOn()))->toBe(["private-chat.{$conversation->id}", 'private-chat.staff'])
        ->and($sent->broadcastWith()['message']['body'])->toBe('Привет');

    $read = new ChatMessagesRead($conversation->id, true, $message->id, now());
    expect($read->broadcastAs())->toBe('messages.read')
        ->and($read->broadcastWith())->toMatchArray(['by_staff' => true, 'up_to_id' => $message->id]);
});

it('keeps the message when the WebSocket server is down', function () {
    config(['broadcasting.default' => 'reverb', 'broadcasting.connections.reverb' => [
        'driver' => 'reverb', 'key' => 'k', 'secret' => 's', 'app_id' => '1',
        'options' => ['host' => '127.0.0.1', 'port' => 1, 'scheme' => 'http', 'useTLS' => false],
    ]]);
    Broadcast::purge();

    $this->actingAs($this->client, 'sanctum')->postJson('/api/v1/chat/messages', ['body' => 'Дойдёт?'])->assertCreated();

    expect(ChatMessage::query()->count())->toBe(1);
});

describe('Telegram ping to the manager', function () {
    beforeEach(function () {
        config(['services.telegram_bot.token' => '123:test', 'app.frontend_url' => 'https://bakhtstroy.tj']);
        Http::fake(['https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => true])]);
        DB::table('telegram_chats')->insert(['phone' => '+992900000001', 'chat_id' => 4242, 'telegram_user_id' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $this->withoutDefer();
    });

    function chatPings(): int
    {
        return Http::recorded(fn (Request $request) => str_ends_with($request->url(), '/sendMessage') && $request['chat_id'] === 4242)->count();
    }

    it('pings an absent manager once per conversation burst', function () {
        $this->manager->forceFill(['last_seen_at' => now()->subHour()])->save();

        $this->actingAs($this->client, 'sanctum')->postJson('/api/v1/chat/messages', ['body' => 'Нужен бетон М300'])->assertCreated();
        $this->actingAs($this->client, 'sanctum')->postJson('/api/v1/chat/messages', ['body' => 'И миксер'])->assertCreated();

        expect(chatPings())->toBe(1);
        Http::assertSent(fn (Request $request) => str_contains((string) $request['text'], 'Нужен бетон М300')
            && str_contains((string) $request['text'], 'https://bakhtstroy.tj/admin/chats/'));
    });

    it('does not disturb a manager who is on the site', function () {
        $this->manager->forceFill(['last_seen_at' => now()])->save();

        $this->actingAs($this->client, 'sanctum')->postJson('/api/v1/chat/messages', ['body' => 'Здравствуйте'])->assertCreated();

        expect(chatPings())->toBe(0);
    });
});
