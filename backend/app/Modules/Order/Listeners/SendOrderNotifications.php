<?php

declare(strict_types=1);

namespace App\Modules\Order\Listeners;

use App\Modules\Order\Events\OrderPlaced;
use App\Modules\Order\Events\OrderStatusChanged;
use App\Modules\Order\Notifications\NewOrderForStaffNotification;
use App\Modules\Order\Notifications\OrderPlacedNotification;
use App\Modules\Order\Notifications\OrderStatusChangedNotification;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * Notifies the client and the staff about order events.
 */
final class SendOrderNotifications
{
    public function orderPlaced(OrderPlaced $event): void
    {
        $event->order->user->notify(new OrderPlacedNotification($event->order));

        $staff = User::query()
            ->role(array_map(fn (Role $role) => $role->value, Role::staff()))
            ->whereNull('blocked_at')
            ->get();

        Notification::send($staff, new NewOrderForStaffNotification($event->order));
    }

    public function statusChanged(OrderStatusChanged $event): void
    {
        // The client already knows about a cancellation they made themselves.
        if ($event->byClient) {
            return;
        }

        $event->order->user->notify(new OrderStatusChangedNotification($event->order, $event->to));
    }
}
