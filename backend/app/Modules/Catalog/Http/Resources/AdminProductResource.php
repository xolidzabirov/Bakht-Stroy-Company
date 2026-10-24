<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Models\Product;
use Illuminate\Http\Request;

/**
 * Product for the admin panel: shop fields plus service data.
 *
 * @mixin Product
 */
final class AdminProductResource extends ProductResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'category_id' => $this->category_id,
            'is_active' => $this->is_active,
            'is_low_stock' => $this->stock <= (int) config('shop.low_stock_threshold'),
            'views_count' => $this->views_count,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
