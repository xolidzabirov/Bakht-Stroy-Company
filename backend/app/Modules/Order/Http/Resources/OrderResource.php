<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Resources;

use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Order\Models\OrderStatusHistory;
use Illuminate\Http\Request;

/**
 * Full order: items, delivery, contacts, totals and status history.
 *
 * @mixin Order
 */
class OrderResource extends OrderListResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            /** Адрес доставки (null при самовывозе). */
            'address' => $this->address,
            'customer' => [
                'name' => $this->customer_name,
                'phone' => $this->customer_phone,
                'email' => $this->customer_email,
            ],
            'comment' => $this->comment,
            /** Сумма товаров. */
            'subtotal' => $this->subtotal,
            /** Стоимость доставки (0 — бесплатно). */
            'delivery_price' => $this->delivery_price,
            'discount' => $this->discount,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                /** slug, если товар ещё продаётся — для ссылки на страницу товара. */
                'product_slug' => $this->productSlug($item->product),
                'name' => $item->product_name,
                'sku' => $item->product_sku,
                'unit' => ['value' => $item->unit->value, 'label' => $item->unit->label()],
                /** Цена на момент заказа. */
                'price' => $item->price,
                'quantity' => $item->quantity,
                'total' => $item->total,
                'image' => $item->product?->getFirstMediaUrl(Product::IMAGES_COLLECTION, 'thumb') ?: null,
            ])->all()),
            'history' => $this->whenLoaded('history', fn () => $this->history->map(fn (OrderStatusHistory $entry) => [
                'status' => ['value' => $entry->status->value, 'label' => $entry->status->label()],
                'comment' => $entry->comment,
                'created_at' => $entry->created_at->toIso8601String(),
            ])->all()),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }

    private function productSlug(?Product $product): ?string
    {
        return $product !== null && ! $product->trashed() && $product->is_active ? $product->slug : null;
    }
}
