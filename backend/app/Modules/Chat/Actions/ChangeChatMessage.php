<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions;

use App\Modules\Chat\Events\ChatMessageChanged;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Support\ChatBroadcaster;
use App\Modules\User\Models\User;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Editing and deleting one's own messages. Others see "изменено" / "Сообщение удалено" right away.
 */
final class ChangeChatMessage
{
    public function __construct(private readonly ChatBroadcaster $broadcaster) {}

    public function edit(ChatMessage $message, User $user, string $body): ChatMessage
    {
        $this->ensureOwn($message, $user);

        if ($message->created_at->lt(now()->subHours(ChatMessage::EDIT_WINDOW_HOURS))) {
            throw ValidationException::withMessages(['body' => 'Сообщение можно изменить только в течение '.ChatMessage::EDIT_WINDOW_HOURS.' часов.']);
        }

        $body = trim($body);

        if ($body === '' && $message->getMedia(ChatMessage::ATTACHMENTS)->isEmpty() && $message->product_id === null && $message->order_id === null) {
            throw ValidationException::withMessages(['body' => 'Сообщение не может быть пустым.']);
        }

        if ($body !== (string) $message->body) {
            $message->forceFill(['body' => $body === '' ? null : $body, 'edited_at' => now()])->save();
            $this->changed($message);
        }

        return $message->load(ChatMessage::RELATIONS);
    }

    public function delete(ChatMessage $message, User $user): ChatMessage
    {
        $this->ensureOwn($message, $user);

        $message->clearMediaCollection(ChatMessage::ATTACHMENTS);
        $message->forceFill(['body' => null, 'deleted_at' => now()])->save();
        $this->changed($message);

        return $message;
    }

    private function ensureOwn(ChatMessage $message, User $user): void
    {
        if ($message->sender_id !== $user->id) {
            throw new AccessDeniedHttpException('Можно менять только свои сообщения.');
        }

        if ($message->isDeleted()) {
            throw ValidationException::withMessages(['message' => 'Сообщение уже удалено.']);
        }
    }

    private function changed(ChatMessage $message): void
    {
        $message->load(ChatMessage::RELATIONS);
        $this->broadcaster->send(new ChatMessageChanged($message, created: false));
    }
}
