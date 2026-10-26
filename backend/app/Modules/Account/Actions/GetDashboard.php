<?php

declare(strict_types=1);

namespace App\Modules\Account\Actions;

use App\Modules\Cart\Models\CartItem;
use App\Modules\Favorite\Models\Favorite;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Http\Resources\OrderListResource;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;

/**
 * Numbers for the "Overview" page of the account.
 */
final class GetDashboard
{
    /**
     * @return array<string, mixed>
     */
    public function handle(User $user): array
    {
        $orders = Order::query()->where('user_id', $user->id);
        $final = [OrderStatus::Completed, OrderStatus::Cancelled];

        $lastOrder = (clone $orders)->withCount('items')->latest('id')->first();

        return [
            'orders' => [
                'total' => (clone $orders)->count(),
                'active' => (clone $orders)->whereNotIn('status', $final)->count(),
                'completed' => (clone $orders)->where('status', OrderStatus::Completed)->count(),
                /** Сумма выполненных заказов, в дирамах (1 сомони = 100 дирам). */
                'spent' => (int) (clone $orders)->where('status', OrderStatus::Completed)->sum('total'),
            ],
            'last_order' => $lastOrder ? OrderListResource::make($lastOrder) : null,
            'favorites_count' => Favorite::query()->where('user_id', $user->id)->count(),
            'cart_items_count' => CartItem::query()->where('user_id', $user->id)->count(),
            'unread_notifications_count' => $user->unreadNotifications()->count(),
        ];
    }
}
