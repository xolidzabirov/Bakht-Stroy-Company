<?php

declare(strict_types=1);

namespace App\Modules\Cart\Http\Resources;

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Http\Resources\ProductListResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CartItem
 */
final class CartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /** id позиции корзины (для PATCH/DELETE /cart/items/{id}). */
            'id' => $this->id,
            'product' => ProductListResource::make($this->product),
            /** @example 10 */
            'quantity' => $this->quantity,
            /** Цена за единицу сейчас, в сумах. */
            'price' => $this->product->price ?? 0,
            /** price × quantity. */
            'total' => $this->total(),
            /**
             * null — всё в порядке; unavailable — товар больше не продаётся;
             * not_enough_stock — на складе меньше; below_min_order — меньше минимального заказа.
             *
             * @example null
             */
            'problem' => $this->problem(),
        ];
    }
}
