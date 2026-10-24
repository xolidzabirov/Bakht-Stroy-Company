<?php

declare(strict_types=1);

namespace App\Modules\Cart\Models;

use App\Modules\Cart\Database\Factories\CartItemFactory;
use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $product_id
 * @property int $quantity
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Product|null $product
 */
#[UseFactory(CartItemFactory::class)]
#[Fillable(['user_id', 'product_id', 'quantity'])]
class CartItem extends Model
{
    /** @use HasFactory<CartItemFactory> */
    use HasFactory;

    public const PROBLEM_UNAVAILABLE = 'unavailable';

    public const PROBLEM_NOT_ENOUGH_STOCK = 'not_enough_stock';

    public const PROBLEM_BELOW_MIN_ORDER = 'below_min_order';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'product_id' => 'integer',
            'quantity' => 'integer',
        ];
    }

    /**
     * Including soft-deleted products, so the cart can say "no longer sold".
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    /**
     * Why this line cannot be ordered right now, or null when everything is fine.
     */
    public function problem(): ?string
    {
        $product = $this->product;

        if ($product === null || $product->trashed() || ! $product->isVisible()) {
            return self::PROBLEM_UNAVAILABLE;
        }

        if ($this->quantity > $product->stock) {
            return self::PROBLEM_NOT_ENOUGH_STOCK;
        }

        if ($this->quantity < $product->min_order_qty) {
            return self::PROBLEM_BELOW_MIN_ORDER;
        }

        return null;
    }

    public function total(): int
    {
        return ($this->product->price ?? 0) * $this->quantity;
    }
}
