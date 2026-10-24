<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Resources;

use App\Modules\Content\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Banner
 */
final class BannerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $image = $this->relationLoaded('media') ? $this->getFirstMedia(Banner::IMAGE_COLLECTION) : null;
        $mobile = $this->relationLoaded('media') ? $this->getFirstMedia(Banner::MOBILE_IMAGE_COLLECTION) : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'button_text' => $this->button_text,
            'link' => $this->link,
            /** 1920×600 WebP или null. */
            'image' => $image ? ($image->hasGeneratedConversion('desktop') ? $image->getUrl('desktop') : $image->getUrl()) : null,
            /** 800×800 WebP (своя мобильная картинка или обрезанная основная) или null. */
            'image_mobile' => match (true) {
                $mobile !== null => $mobile->hasGeneratedConversion('mobile') ? $mobile->getUrl('mobile') : $mobile->getUrl(),
                $image !== null => $image->hasGeneratedConversion('mobile') ? $image->getUrl('mobile') : $image->getUrl(),
                default => null,
            },
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
        ];
    }
}
