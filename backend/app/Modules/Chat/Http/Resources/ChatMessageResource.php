<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Resources;

use App\Modules\Catalog\Models\Product;
use App\Modules\Chat\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Chat message. A deleted message keeps only its place, author and time.
 *
 * @mixin ChatMessage
 */
final class ChatMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $deleted = $this->isDeleted();
        $reply = $this->replyTo;
        $product = $deleted ? null : $this->product;
        $order = $deleted ? null : $this->order;

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            /** true — написал магазин (менеджер или админ), false — покупатель. */
            'from_staff' => $this->from_staff,
            'sender' => $this->sender ? ['id' => $this->sender->id, 'name' => $this->sender->name] : null,
            /** @example Здравствуйте! Есть цемент М500 в наличии? */
            'body' => $deleted ? null : $this->body,
            /** @var list<array{id: int, name: string, size: int, mime: string, is_image: bool, url: string, thumb: string|null}> */
            'attachments' => $deleted ? [] : $this->getMedia(ChatMessage::ATTACHMENTS)->map(fn (Media $media) => self::attachment($media))->values()->all(),
            /** Цитата: на какое сообщение это ответ. */
            'reply_to' => $reply ? [
                'id' => $reply->id,
                'from_staff' => $reply->from_staff,
                'is_deleted' => $reply->isDeleted(),
                'body' => $reply->isDeleted() ? null : Str::limit((string) $reply->body, 140),
                'has_attachments' => ! $reply->isDeleted() && $reply->getMedia(ChatMessage::ATTACHMENTS)->isNotEmpty(),
            ] : null,
            /** Карточка товара внутри сообщения. */
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                /** В дирамах. */
                'price' => $product->price,
                'unit' => $product->unit->label(),
                'image' => $product->getFirstMediaUrl(Product::IMAGES_COLLECTION, 'thumb') ?: null,
            ] : null,
            /** Ссылка на заказ. */
            'order' => $order ? [
                'number' => $order->number,
                'status' => ['value' => $order->status->value, 'label' => $order->status->label()],
                /** В дирамах. */
                'total' => $order->total,
            ] : null,
            'is_edited' => $this->edited_at !== null,
            'is_deleted' => $deleted,
            /** Когда прочитано другой стороной; null — ещё не прочитано (одна галочка). */
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }

    /**
     * @return array{id: int, name: string, size: int, mime: string, is_image: bool, url: string, thumb: string|null}
     */
    private static function attachment(Media $media): array
    {
        $isImage = str_starts_with((string) $media->mime_type, 'image/');

        return [
            'id' => $media->id,
            'name' => $media->file_name,
            'size' => (int) $media->size,
            'mime' => (string) $media->mime_type,
            'is_image' => $isImage,
            'url' => $media->getUrl(),
            'thumb' => $isImage && $media->hasGeneratedConversion('thumb') ? $media->getUrl('thumb') : null,
        ];
    }
}
