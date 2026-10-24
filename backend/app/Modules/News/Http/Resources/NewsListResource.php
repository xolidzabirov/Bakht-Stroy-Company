<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Resources;

use App\Modules\Catalog\Http\Resources\ImageResource;
use App\Modules\News\Models\News;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * News card for lists.
 *
 * @mixin News
 */
class NewsListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $cover = $this->relationLoaded('media') ? $this->getFirstMedia(News::COVER_COLLECTION) : null;

        return [
            'id' => $this->id,
            'type' => [
                /** @example promo */
                'value' => $this->type->value,
                /** @example Акции */
                'label' => $this->type->label(),
            ],
            /** @example Скидка 10% на цемент М500 */
            'title' => $this->title,
            /** @example skidka-10-na-tsement-m500 */
            'slug' => $this->slug,
            /** Краткое описание (или начало текста). */
            'excerpt' => $this->summary(),
            /** Обложка: thumb 400×260, card 800×500, full до 1600px; null — нет. */
            'cover' => $cover ? ImageResource::make($cover) : null,
            'is_pinned' => $this->is_pinned,
            /** Время чтения, минут. */
            'reading_time' => $this->readingTime(),
            'views_count' => $this->views_count,
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
