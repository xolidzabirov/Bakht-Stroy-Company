<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Models\Product;
use Illuminate\Http\Request;

/**
 * Full product page.
 *
 * @mixin Product
 */
class ProductResource extends ProductListResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'description' => $this->description,
            /**
             * Характеристики.
             *
             * @var list<array{name: string, value: string}>
             */
            'specs' => $this->specs,
            /** @var list<ImageResource> */
            'images' => ImageResource::collection($this->whenLoaded('media', fn () => $this->getMedia(Product::IMAGES_COLLECTION))),
            'category' => CategoryResource::make($this->whenLoaded('category')),
        ];
    }
}
