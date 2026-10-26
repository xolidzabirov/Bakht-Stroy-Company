<?php

declare(strict_types=1);

namespace App\Modules\Order\Listeners;

use App\Modules\Order\Events\OrderPlaced;
use App\Modules\Order\Events\OrderStatusChanged;
use Illuminate\Support\Facades\Log;

/**
 * Separate log of money-related events: storage/logs/orders-<date>.log.
 */
final class LogOrderEvents
{
    public function orderPlaced(OrderPlaced $event): void
    {
        Log::channel('orders')->info('Order placed', [
            'number' => $event->order->number,
            'user_id' => $event->order->user_id,
            'total' => $event->order->total,
            'delivery' => $event->order->delivery_type->value,
            'payment' => $event->order->payment_method->value,
        ]);
    }

    public function statusChanged(OrderStatusChanged $event): void
    {
        Log::channel('orders')->info('Order status changed', [
            'number' => $event->order->number,
            'from' => $event->from->value,
            'to' => $event->to->value,
            'by_client' => $event->byClient,
        ]);
    }
}
