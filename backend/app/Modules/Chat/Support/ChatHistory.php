<?php

declare(strict_types=1);

namespace App\Modules\Chat\Support;

use App\Modules\Chat\Http\Resources\ChatMessageResource;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Message history page by page, from the newest back: ?before_id=… loads older messages when scrolling up.
 */
final class ChatHistory
{
    public const PER_PAGE = 30;

    public static function page(Conversation $conversation, Request $request): AnonymousResourceCollection
    {
        $limit = min(max($request->integer('limit', self::PER_PAGE), 1), 100);
        $beforeId = $request->integer('before_id');

        $messages = $conversation->messages()
            ->with(ChatMessage::RELATIONS)
            ->when($beforeId > 0, fn ($query) => $query->where('id', '<', $beforeId))
            ->orderByDesc('id')
            ->limit($limit + 1)
            ->get();

        $hasMore = $messages->count() > $limit;

        return ChatMessageResource::collection($messages->take($limit)->reverse()->values())
            ->additional(['meta' => ['has_more' => $hasMore]]);
    }
}
