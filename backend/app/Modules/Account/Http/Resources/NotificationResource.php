<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;

/**
 * @mixin DatabaseNotification
 */
final class NotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $data */
        $data = $this->data;

        return [
            /** @example 9d3f0c2e-6b1a-4f7e-9a51-0d3c2b1a9f00 */
            'id' => $this->id,
            /**
             * order_placed, order_status_changed, new_order (для менеджеров).
             *
             * @example order_status_changed
             */
            'type' => $data['type'] ?? null,
            /** @example Заказ BS-000001: В пути */
            'title' => $data['title'] ?? null,
            'text' => $data['text'] ?? null,
            /** Номер заказа для ссылки, если уведомление о заказе. */
            'order_number' => $data['order_number'] ?? null,
            'is_read' => $this->read_at !== null,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
