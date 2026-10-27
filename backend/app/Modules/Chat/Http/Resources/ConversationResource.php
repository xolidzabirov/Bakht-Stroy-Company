<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Resources;

use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Models\Conversation;
use App\Modules\Chat\Support\Presence;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Inbox row for the shop team: customer, assigned manager, last message preview, unread count.
 *
 * @mixin Conversation
 */
final class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $client = $this->user;
        $last = $this->lastMessage;

        return [
            'id' => $this->id,
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                /** @example +992931234567 */
                'phone' => $client->phone,
                'email' => $client->email,
                'is_online' => Presence::isOnline($client->last_seen_at),
                'last_seen_at' => $client->last_seen_at?->toIso8601String(),
            ],
            /** Ответственный менеджер; null — ещё никто не отвечал. */
            'manager' => $this->manager ? ['id' => $this->manager->id, 'name' => $this->manager->name] : null,
            'last_message' => $last ? [
                'id' => $last->id,
                'from_staff' => $last->from_staff,
                'is_deleted' => $last->isDeleted(),
                'body' => $last->isDeleted() ? null : Str::limit((string) $last->body, 100),
                'has_attachments' => ! $last->isDeleted() && $last->getMedia(ChatMessage::ATTACHMENTS)->isNotEmpty(),
                'has_product' => $last->product_id !== null,
                'has_order' => $last->order_id !== null,
                'read_at' => $last->read_at?->toIso8601String(),
                'created_at' => $last->created_at->toIso8601String(),
            ] : null,
            /** Непрочитанные сообщения покупателя. */
            'unread_count' => (int) ($this->unread_for_staff ?? 0),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
        ];
    }
}
