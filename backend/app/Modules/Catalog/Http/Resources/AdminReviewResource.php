<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A review for the shop team: who wrote it and how to reach them.
 *
 * @mixin Review
 */
final class AdminReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            /** @example 2 */
            'rating' => $this->rating,
            /** @example Мешок пришёл порванным. */
            'body' => $this->body,
            'author' => [
                'id' => $this->user_id,
                /** @example Халид Забиров */
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
                /** Аккаунт удалён. */
                'deleted' => (bool) $this->user?->trashed(),
            ],
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
