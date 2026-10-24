<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Product / category photo with ready-made sizes (WebP).
 *
 * @mixin Media
 */
final class ImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $hasConversion = fn (string $name): bool => $this->hasGeneratedConversion($name);

        return [
            'id' => $this->id,
            /** 300×300 — списки, корзина. */
            'thumb' => $hasConversion('thumb') ? $this->getUrl('thumb') : $this->getUrl(),
            /** 600×600 — карточка товара в каталоге. */
            'card' => $hasConversion('card') ? $this->getUrl('card') : $this->getUrl(),
            /** до 1600px — страница товара. */
            'full' => $hasConversion('full') ? $this->getUrl('full') : $this->getUrl(),
            'original' => $this->getUrl(),
        ];
    }
}
