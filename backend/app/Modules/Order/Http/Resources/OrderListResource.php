<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Resources;

use App\Modules\Order\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Short order for lists.
 *
 * @mixin Order
 */
class OrderListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            /** @example BS-000123 */
            'number' => $this->number,
            'status' => [
                /** @example new */
                'value' => $this->status->value,
                /** @example Новый */
                'label' => $this->status->label(),
            ],
            'payment_method' => ['value' => $this->payment_method->value, 'label' => $this->payment_method->label()],
            'payment_status' => ['value' => $this->payment_status->value, 'label' => $this->payment_status->label()],
            'delivery_type' => ['value' => $this->delivery_type->value, 'label' => $this->delivery_type->label()],
            /** Итого к оплате, в сумах. */
            'total' => $this->total,
            'items_count' => $this->whenCounted('items', fn () => (int) $this->items_count),
            /** Покупатель ещё может отменить заказ. */
            'can_cancel' => $this->status->canBeCancelledByClient(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
