<?php

declare(strict_types=1);

namespace App\Modules\Order\Notifications;

use App\Modules\Order\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * To the client: the order is accepted.
 */
final class OrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

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
            ->subject("Заказ {$this->order->number} принят — Bakht Stroy")
            ->greeting("Здравствуйте, {$this->order->customer_name}!")
            ->line("Ваш заказ {$this->order->number} на сумму ".number_format($this->order->total, 0, '', ' ').' сум принят.')
            ->line('Менеджер свяжется с вами по телефону '.$this->order->customer_phone.' для подтверждения.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_placed',
            'title' => "Заказ {$this->order->number} принят",
            'text' => 'Менеджер свяжется с вами для подтверждения.',
            'order_number' => $this->order->number,
        ];
    }
}
