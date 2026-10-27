<?php

declare(strict_types=1);

namespace App\Modules\Chat\Events;

use App\Modules\Chat\Http\Resources\ChatMessageResource;
use App\Modules\Chat\Models\ChatMessage;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/**
 * A message was sent, edited or deleted. Goes to the conversation and to the staff inbox.
 * Event names on the socket: message.sent, message.updated.
 */
final class ChatMessageChanged implements ShouldBroadcastNow
{
    public readonly int $conversationId;

    /** @var array<string, mixed> */
    private readonly array $payload;

    public function __construct(ChatMessage $message, private readonly bool $created)
    {
        $this->conversationId = $message->conversation_id;
        $this->payload = ChatMessageResource::make($message)->resolve();
    }

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("chat.{$this->conversationId}"), new PrivateChannel('chat.staff')];
    }

    public function broadcastAs(): string
    {
        return $this->created ? 'message.sent' : 'message.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return ['message' => $this->payload];
    }
}
