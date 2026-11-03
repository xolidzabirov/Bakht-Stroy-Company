<?php

declare(strict_types=1);

namespace App\Modules\Auth\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The code that confirms the email of a new account (on-demand notification, the account does not exist yet).
 */
final class RegistrationCodeNotification extends Notification
{
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
            ->subject("{$this->code} — код регистрации в Bakht Stroy")
            ->greeting('Здравствуйте!')
            ->line("Код для регистрации в Bakht Stroy: **{$this->code}**")
            ->line("Код действует {$this->ttlMinutes} минут. Никому его не сообщайте.")
            ->line('Если вы не регистрировались, просто проигнорируйте это письмо.');
    }
}
