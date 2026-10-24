<?php

declare(strict_types=1);

namespace App\Modules\Content\Notifications;

use App\Modules\Content\Models\ContactMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

/**
 * To admins: someone wrote through the contact form.
 */
final class NewContactMessageNotification extends Notification
{
    public function __construct(public readonly ContactMessage $message) {}

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
            'type' => 'contact_message',
            'title' => "Новое сообщение от {$this->message->name}",
            'text' => $this->message->phone.' — '.Str::limit($this->message->message, 120),
            'message_id' => $this->message->id,
        ];
    }
}
