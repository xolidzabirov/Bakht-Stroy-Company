<?php

declare(strict_types=1);

namespace App\Modules\Admin\Http\Resources;

use App\Modules\User\Http\Resources\UserResource;
use App\Modules\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * User for the admin panel: profile, block state and order totals.
 *
 * @mixin User
 */
final class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->getAttributes();

        return [
            ...UserResource::make($this->resource)->toArray($request),
            'is_blocked' => $this->isBlocked(),
            'blocked_at' => $this->blocked_at?->toIso8601String(),
            /** Всего заказов. */
            'orders_count' => (int) ($attributes['orders_count'] ?? 0),
            /** Сумма неотменённых заказов, сум. */
            'orders_total' => (int) ($attributes['orders_total'] ?? 0),
            'last_order_at' => isset($attributes['last_order_at']) ? Carbon::parse($attributes['last_order_at'])->toIso8601String() : null,
        ];
    }
}
