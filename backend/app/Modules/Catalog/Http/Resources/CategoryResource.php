<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Category
 */
final class CategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $image = $this->relationLoaded('media') ? $this->getFirstMedia(Category::IMAGE_COLLECTION) : null;

        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            /** @example Цемент */
            'name' => $this->name,
            /** @example tsement */
            'slug' => $this->slug,
            'description' => $this->description,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            /** URL картинки категории 400×400 или null. */
            'image' => $image ? ($image->hasGeneratedConversion('thumb') ? $image->getUrl('thumb') : $image->getUrl()) : null,
            /** Количество товаров (вместе с подкатегориями). */
            'products_count' => $this->when(
                array_key_exists('products_total', $this->resource->getAttributes()),
                fn () => (int) $this->resource->getAttributes()['products_total'],
            ),
            'parent' => self::make($this->whenLoaded('parent')),
            /** @var list<CategoryResource> */
            'children' => self::collection($this->whenLoaded('children')),
        ];
    }
}
