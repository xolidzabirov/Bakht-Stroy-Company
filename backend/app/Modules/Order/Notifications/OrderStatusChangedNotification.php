<?php

declare(strict_types=1);

namespace App\Modules\Order\Notifications;

use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * To the client: the order moved to a new status.
 */
final class OrderStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Order $order,
        public readonly OrderStatus $status,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Заказ {$this->order->number}: {$this->status->label()}")
            ->greeting("Здравствуйте, {$this->order->customer_name}!")
            ->line("Статус вашего заказа {$this->order->number}: «{$this->status->label()}».");
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_status_changed',
            'title' => "Заказ {$this->order->number}: {$this->status->label()}",
            'text' => "Статус заказа изменён на «{$this->status->label()}».",
            'order_number' => $this->order->number,
            'status' => $this->status->value,
        ];
    }
}
