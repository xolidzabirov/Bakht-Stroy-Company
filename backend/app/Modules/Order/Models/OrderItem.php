<?php

declare(strict_types=1);

namespace App\Modules\Order\Models;

use App\Modules\Catalog\Enums\ProductUnit;
use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A copy of the product line at the time of the order.
 *
 * @property int $id
 * @property int $order_id
 * @property int|null $product_id
 * @property string $product_name
 * @property string|null $product_sku
 * @property ProductUnit $unit
 * @property int $price
 * @property int $quantity
 * @property int $total
 * @property-read Product|null $product
 */
#[Fillable(['order_id', 'product_id', 'product_name', 'product_sku', 'unit', 'price', 'quantity', 'total'])]
class OrderItem extends Model
{
    public $timestamps = false;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_id' => 'integer',
            'product_id' => 'integer',
            'unit' => ProductUnit::class,
            'price' => 'integer',
            'quantity' => 'integer',
            'total' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }
}
