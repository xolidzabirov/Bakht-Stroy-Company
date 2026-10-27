<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions;

use App\Modules\Auth\Support\TelegramBot;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Support\Presence;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * A customer wrote while the manager is away from the site: @BakhtStroyBot pings the manager in Telegram.
 * The manager must have shared their phone with the bot once (/start). At most one ping per
 * conversation every 10 minutes, so a burst of messages does not flood the manager.
 */
final class NotifyStaffAboutMessage
{
    private const PING_EVERY_SECONDS = 600;

    public function __construct(private readonly TelegramBot $bot) {}

    public function handle(int $messageId): void
    {
        if (blank(config('services.telegram_bot.token'))) {
            return;
        }

        $message = ChatMessage::query()->with(['conversation.user', 'conversation.manager', 'media'])->find($messageId);

        if ($message === null || $message->isDeleted()) {
            return;
        }

        $conversation = $message->conversation;

        foreach ($this->recipients($conversation->manager) as $staff) {
            if (Presence::isOnline($staff->last_seen_at) || blank($staff->phone)) {
                continue;
            }

            $chatId = DB::table('telegram_chats')->where('phone', $staff->phone)->value('chat_id');

            if ($chatId === null || ! Cache::add("chat:tg-ping:{$conversation->id}:{$staff->id}", true, self::PING_EVERY_SECONDS)) {
                continue;
            }

            try {
                $this->bot->sendMessage((int) $chatId, $this->text($message));
            } catch (RuntimeException $exception) {
                Log::warning('Chat Telegram ping failed: '.$exception->getMessage());
            }
        }
    }

    /**
     * The assigned manager, or the whole team while nobody has replied yet.
     *
     * @return Collection<int, User>
     */
    private function recipients(?User $manager): Collection
    {
        if ($manager !== null && $manager->isStaff()) {
            return collect([$manager]);
        }

        return User::query()->role(array_map(fn (Role $role) => $role->value, Role::staff()))->whereNull('blocked_at')->get();
    }

    private function text(ChatMessage $message): string
    {
        $preview = match (true) {
            filled($message->body) => Str::limit((string) $message->body, 300),
            $message->getMedia(ChatMessage::ATTACHMENTS)->isNotEmpty() => '📎 Файл',
            $message->product_id !== null => '🧱 Товар',
            default => '📦 Заказ',
        };
        $url = rtrim((string) config('app.frontend_url'), '/')."/admin/chats/{$message->conversation_id}";

        return '💬 <b>Новое сообщение в чате</b>'."\n"
            .'От: '.e($message->conversation->user->name)."\n\n"
            .e($preview)."\n\n"
            ."<a href=\"{$url}\">Ответить на сайте</a>";
    }
}
