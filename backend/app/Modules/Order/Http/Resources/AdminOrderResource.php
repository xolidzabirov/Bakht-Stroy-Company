<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Resources;

use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderStatusHistory;
use Illuminate\Http\Request;

/**
 * Order for the admin panel: plus the customer account, history authors and allowed next statuses.
 *
 * @mixin Order
 */
final class AdminOrderResource extends OrderResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        $data['user'] = $this->whenLoaded('user', fn () => [
            'id' => $this->user->id,
            'name' => $this->user->name,
            'email' => $this->user->email,
            'phone' => $this->user->phone,
            'is_deleted' => $this->user->trashed(),
        ]);

        if ($this->relationLoaded('history')) {
            $data['history'] = $this->history->map(fn (OrderStatusHistory $entry) => [
                'status' => ['value' => $entry->status->value, 'label' => $entry->status->label()],
                'comment' => $entry->comment,
                'author' => $entry->relationLoaded('author') && $entry->author
                    ? ['id' => $entry->author->id, 'name' => $entry->author->name]
                    : null,
                'created_at' => $entry->created_at->toIso8601String(),
            ])->all();
        }

        /** Куда можно перевести заказ сейчас. */
        $data['next_statuses'] = array_map(
            fn (OrderStatus $status) => ['value' => $status->value, 'label' => $status->label()],
            $this->status->nextStatuses(),
        );

        return $data;
    }
}
