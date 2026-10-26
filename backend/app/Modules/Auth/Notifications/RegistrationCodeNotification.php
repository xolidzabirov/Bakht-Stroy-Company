<?php

declare(strict_types=1);

namespace App\Modules\Auth\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to an email address that is not registered yet (on-demand notification).
 */
final class RegistrationCodeNotification extends Notification implements ShouldQueue
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
            ->subject('Код подтверждения регистрации — Bakht Stroy')
            ->greeting('Здравствуйте!')
            ->line("Ваш код для регистрации: **{$this->code}**")
            ->line("Код действует {$this->ttlMinutes} минут.")
            ->line('Если вы не регистрировались в Bakht Stroy, просто проигнорируйте это письмо.');
    }
}
