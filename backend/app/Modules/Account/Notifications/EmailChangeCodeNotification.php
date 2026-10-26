<?php

declare(strict_types=1);

namespace App\Modules\Account\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the new email address (on-demand notification).
 */
final class EmailChangeCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $code,
        public readonly int $ttlMinutes,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Подтверждение нового email — Bakht Stroy')
            ->greeting('Здравствуйте!')
            ->line("Код для смены email в аккаунте Bakht Stroy: **{$this->code}**")
            ->line("Код действует {$this->ttlMinutes} минут.")
            ->line('Если вы не меняли email, просто проигнорируйте это письмо.');
    }
}
