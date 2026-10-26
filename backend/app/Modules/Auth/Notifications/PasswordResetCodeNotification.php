<?php

declare(strict_types=1);

namespace App\Modules\Auth\Notifications;

use App\Modules\User\Models\User;
use App\Shared\Notifications\Channels\SmsChannel;
use App\Shared\Notifications\SmsMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class PasswordResetCodeNotification extends Notification implements ShouldQueue, SmsMessage
{
    use Queueable;

    public function __construct(
        public readonly string $code,
        public readonly int $ttlMinutes,
    ) {}

    /**
     * @return list<string>
     */
    public function via(User $notifiable): array
    {
        return $notifiable->phone ? ['mail', SmsChannel::class] : ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Код для сброса пароля')
            ->greeting("Здравствуйте, {$notifiable->name}!")
            ->line("Ваш код для сброса пароля: **{$this->code}**")
            ->line("Код действует {$this->ttlMinutes} минут.")
            ->line('Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.');
    }

    public function toSms(object $notifiable): string
    {
        return "Bakht Stroy: код для сброса пароля {$this->code}. Действует {$this->ttlMinutes} мин.";
    }
}
