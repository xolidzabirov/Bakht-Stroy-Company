<?php

declare(strict_types=1);

namespace App\Modules\Cart\Http\Resources;

use App\Modules\Cart\Models\CartItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The whole cart: lines and totals. Lines with problems are not counted in the totals.
 *
 * @property Collection<int, CartItem> $resource
 */
final class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $orderable = $this->resource->filter(fn (CartItem $item) => $item->problem() === null);

        return [
            /** @var list<CartItemResource> */
            'items' => CartItemResource::collection($this->resource),
            /** Количество разных товаров. */
            'items_count' => $this->resource->count(),
            /** Сумма товаров, которые можно заказать, в дирамах (1 сомони = 100 дирам). */
            'subtotal' => $orderable->sum(fn (CartItem $item) => $item->total()),
            /** Есть позиции, которые нельзя заказать (см. items.*.problem). */
            'has_problems' => $orderable->count() !== $this->resource->count(),
            'can_checkout' => $orderable->isNotEmpty() && $orderable->count() === $this->resource->count(),
        ];
    }
}
