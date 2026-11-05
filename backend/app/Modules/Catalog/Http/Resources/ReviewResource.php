<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A review on the product page: the author is shown as a first name and an initial.
 *
 * @mixin Review
 */
final class ReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            /** @example 5 */
            'rating' => $this->rating,
            /** @example Цемент свежий, привезли вовремя. */
            'body' => $this->body,
            /**
             * Имя и первая буква фамилии; null — аккаунт удалён.
             *
             * @example Халид З.
             */
            'author' => $this->publicName(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }

    private function publicName(): ?string
    {
        $user = $this->user;

        if ($user === null || $user->trashed()) {
            return null;
        }

        $words = preg_split('/\s+/u', trim($user->name)) ?: [];
        $first = $words[0] ?? '';
        $last = $words[1] ?? '';

        return $last === '' ? $first : $first.' '.mb_substr($last, 0, 1).'.';
    }
}
