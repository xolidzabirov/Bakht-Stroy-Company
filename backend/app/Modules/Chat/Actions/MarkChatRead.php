<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions;

use App\Modules\Chat\Events\ChatMessagesRead;
use App\Modules\Chat\Models\Conversation;
use App\Modules\Chat\Support\ChatBroadcaster;

/**
 * The customer (or the shop) opened the conversation: the other side's messages become read (✓✓).
 */
final class MarkChatRead
{
    public function __construct(private readonly ChatBroadcaster $broadcaster) {}

    /**
     * @return int how many messages were marked
     */
    public function handle(Conversation $conversation, bool $byStaff): int
    {
        $unread = $conversation->messages()->unread(fromStaff: ! $byStaff);
        $upToId = (int) (clone $unread)->max('id');

        if ($upToId === 0) {
            return 0;
        }

        $readAt = now();
        $count = $unread->where('id', '<=', $upToId)->update(['read_at' => $readAt]);

        $this->broadcaster->send(new ChatMessagesRead($conversation->id, $byStaff, $upToId, $readAt));

        return $count;
    }
}
