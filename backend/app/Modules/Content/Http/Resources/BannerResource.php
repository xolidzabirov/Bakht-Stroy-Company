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

        $url = fn (string $conversion) => $image?->hasGeneratedConversion($conversion) ? $image->getUrl($conversion) : $image?->getUrl();

        return [
            'id' => $this->id,
            /** hero — фото-карусель первого экрана, promo — полоса баннеров под ним. */
            'placement' => $this->placement,
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
            /**
             * Только у слайдов первого экрана: 860×688 и 1280×1024 WebP.
             *
             * @var array{small: string, large: string}|null
             */
            'image_hero' => $this->isHero() && $image !== null ? ['small' => $url('hero_860'), 'large' => $url('hero_1280')] : null,
            /** Только у фото работ: 900×600 WebP. */
            'image_work' => $this->isWork() && $image !== null ? $url('work') : null,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
        ];
    }
}
