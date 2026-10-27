<?php

declare(strict_types=1);

namespace App\Modules\Chat\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Support\Carbon;

/**
 * One side read the other side's messages up to $upToId: the sender's ✓ turns into ✓✓.
 */
final class ChatMessagesRead implements ShouldBroadcastNow
{
    public function __construct(
        public readonly int $conversationId,
        public readonly bool $byStaff,
        public readonly int $upToId,
        public readonly Carbon $readAt,
    ) {}

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("chat.{$this->conversationId}"), new PrivateChannel('chat.staff')];
    }

    public function broadcastAs(): string
    {
        return 'messages.read';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'by_staff' => $this->byStaff,
            'up_to_id' => $this->upToId,
            'read_at' => $this->readAt->toIso8601String(),
        ];
    }
}
