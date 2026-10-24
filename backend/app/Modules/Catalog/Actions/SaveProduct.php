<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\DTO\ProductData;
use App\Modules\Catalog\Models\Product;
use App\Shared\Support\UniqueSlug;
use Illuminate\Support\Facades\DB;

/**
 * Creates a product or updates an existing one. A missing SKU becomes BS-000123.
 */
final class SaveProduct
{
    public function handle(ProductData $data, ?Product $product = null): Product
    {
        return DB::transaction(function () use ($data, $product): Product {
            $product ??= new Product;

            // Slug is kept on rename so links do not break; it changes only when sent explicitly.
            $slugSource = $data->slug ?: ($product->exists ? null : $data->name);

            $product->fill($data->toAttributes());

            if ($slugSource !== null) {
                $product->slug = UniqueSlug::for(Product::class, $slugSource, $product->exists ? $product->id : null);
            }

            $product->save();

            if ($product->sku === null) {
                $product->forceFill(['sku' => sprintf('BS-%06d', $product->id)])->save();
            }

            return $product->load(['category.parent', 'media']);
        });
    }
}
