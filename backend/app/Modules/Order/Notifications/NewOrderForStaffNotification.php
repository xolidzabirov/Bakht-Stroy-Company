<?php

declare(strict_types=1);

namespace App\Modules\Order\Notifications;

use App\Modules\Order\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * To admins: a new order to process (shown in the admin panel).
 */
final class NewOrderForStaffNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_order',
            'title' => "Новый заказ {$this->order->number}",
            'text' => "{$this->order->customer_name}, {$this->order->customer_phone} — "
                .number_format($this->order->total, 0, '', ' ').' сум',
            'order_id' => $this->order->id,
            'order_number' => $this->order->number,
        ];
    }
}
