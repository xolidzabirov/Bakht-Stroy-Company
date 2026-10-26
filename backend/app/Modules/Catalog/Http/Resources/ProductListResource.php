<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Models\Product;
use App\Shared\Contracts\FavoriteProducts;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Short product card for lists and grids.
 *
 * @mixin Product
 */
class ProductListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $image = $this->relationLoaded('media') ? $this->getFirstMedia(Product::IMAGES_COLLECTION) : null;

        return [
            'id' => $this->id,
            /** @example Цемент М500 Д0, 50 кг */
            'name' => $this->name,
            /** @example tsement-m500-d0-50-kg */
            'slug' => $this->slug,
            /** @example BS-000002 */
            'sku' => $this->sku,
            /**
             * Цена за единицу в дирамах (1 сомони = 100 дирам): 6550 = 65,50 сом.
             *
             * @example 69000
             */
            'price' => $this->price,
            /** @example 75000 */
            'old_price' => $this->old_price,
            /** @example 8 */
            'discount_percent' => $this->discountPercent(),
            'unit' => [
                /** @example bag */
                'value' => $this->unit->value,
                /** @example мешок */
                'label' => $this->unit->label(),
            ],
            'stock' => $this->stock,
            'min_order_qty' => $this->min_order_qty,
            'in_stock' => $this->inStock(),
            'is_featured' => $this->is_featured,
            /** В избранном у текущего пользователя (false для гостей). */
            'is_favorite' => app(FavoriteProducts::class)->isFavorite($this->id),
            /** Главное фото или null. */
            'image' => $image ? ImageResource::make($image) : null,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
        ];
    }
}
