<?php

declare(strict_types=1);

namespace App\Shared\Notifications\Channels;

use App\Shared\Notifications\SmsMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * SMS delivery. For now messages are written to storage/logs/sms.log;
 * a real provider (Eskiz) will be plugged in here later.
 */
final class SmsChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! $notification instanceof SmsMessage || ! method_exists($notifiable, 'routeNotificationFor')) {
            return;
        }

        $to = $notifiable->routeNotificationFor('sms', $notification);

        if (! is_string($to) || $to === '') {
            return;
        }

        Log::channel('sms')->info('SMS', [
            'to' => $to,
            'text' => $notification->toSms($notifiable),
        ]);
    }
}
