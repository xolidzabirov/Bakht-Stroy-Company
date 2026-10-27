<?php

use App\Modules\Chat\Models\Conversation;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
| Private WebSocket channels of the chat. The first matching pattern wins, so "chat.staff" goes first.
*/

// Shop team inbox: new messages and read marks in every conversation.
Broadcast::channel('chat.staff', fn (User $user): bool => $user->isStaff());

// One conversation: its customer and the shop team.
Broadcast::channel('chat.{conversationId}', fn (User $user, string $conversationId): bool => ctype_digit($conversationId)
    && ($user->isStaff() || Conversation::query()->whereKey((int) $conversationId)->where('user_id', $user->id)->exists()));
