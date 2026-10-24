<?php

declare(strict_types=1);

namespace App\Shared\Notifications;

/**
 * A notification that can be delivered by SMS through SmsChannel.
 */
interface SmsMessage
{
    public function toSms(object $notifiable): string;
}
