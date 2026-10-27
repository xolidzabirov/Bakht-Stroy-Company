<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Controllers;

use App\Modules\Chat\Actions\ChangeChatMessage;
use App\Modules\Chat\Actions\MarkChatRead;
use App\Modules\Chat\Actions\SendChatMessage;
use App\Modules\Chat\Http\Requests\SendMessageRequest;
use App\Modules\Chat\Http\Resources\ChatMessageResource;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Models\Conversation;
use App\Modules\Chat\Support\ChatHistory;
use App\Modules\Chat\Support\Presence;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The customer's chat with the shop. Live updates come over WebSocket (private channel chat.{id}):
 * message.sent, message.updated, messages.read and the "client-typing" whisper.
 */
#[Group('Чат с менеджером', weight: 7)]
final class ChatController extends Controller
{
    /**
     * Мой диалог
     *
     * Создаётся при первом обращении. manager — кто отвечает (или «Bakht Stroy», пока никто не ответил),
     * его статус «в сети» и непрочитанные ответы магазина.
     */
    public function show(#[CurrentUser] User $user): JsonResponse
    {
        $conversation = Conversation::of($user)->load('manager');
        $manager = $conversation->manager;
        $lastSeen = $manager !== null ? $manager->last_seen_at : Presence::staffLastSeen();

        return response()->json(['data' => [
            'id' => $conversation->id,
            'manager' => [
                /** @example Фирдавс */
                'name' => $manager !== null ? $manager->name : 'Bakht Stroy',
                'is_assigned' => $manager !== null,
                'is_online' => Presence::isOnline($lastSeen),
                'last_seen_at' => $lastSeen?->toIso8601String(),
            ],
            'unread_count' => $conversation->messages()->unread(fromStaff: true)->count(),
            /** Можно отправить до 5 файлов по 10 МБ этих типов. */
            'limits' => [
                'max_files' => SendMessageRequest::MAX_FILES,
                'max_file_size_kb' => SendMessageRequest::MAX_FILE_SIZE,
                'file_types' => SendMessageRequest::FILE_TYPES,
                'edit_window_hours' => ChatMessage::EDIT_WINDOW_HOURS,
            ],
        ]]);
    }

    /**
     * Сообщения
     *
     * Новые в конце. Чтобы подгрузить более старые, передайте before_id — id самого раннего из загруженных.
     * В meta.has_more — есть ли ещё.
     */
    #[QueryParameter('before_id', description: 'Сообщения старше этого id', type: 'int')]
    #[QueryParameter('limit', description: 'Сколько, до 100', type: 'int', example: 30)]
    public function messages(Request $request, #[CurrentUser] User $user): AnonymousResourceCollection
    {
        return ChatHistory::page(Conversation::of($user), $request);
    }

    /**
     * Написать
     *
     * Текст, до 5 файлов (multipart/form-data, поле attachments[]), ответ на сообщение, карточка товара или свой заказ.
     */
    public function send(SendMessageRequest $request, #[CurrentUser] User $user, SendChatMessage $send): JsonResponse
    {
        $message = $send->handle(Conversation::of($user), $user, false, $request->payload(), $request->uploads());

        return ChatMessageResource::make($message)->response()->setStatusCode(201);
    }

    /**
     * Изменить своё сообщение
     *
     * В течение 48 часов после отправки.
     */
    public function update(Request $request, #[CurrentUser] User $user, int $message, ChangeChatMessage $change): ChatMessageResource
    {
        $data = $request->validate(['body' => ['present', 'nullable', 'string', 'max:4000']]);

        return ChatMessageResource::make($change->edit($this->find($user, $message), $user, (string) ($data['body'] ?? '')));
    }

    /**
     * Удалить своё сообщение
     *
     * У обеих сторон останется «Сообщение удалено».
     */
    public function destroy(#[CurrentUser] User $user, int $message, ChangeChatMessage $change): ChatMessageResource
    {
        return ChatMessageResource::make($change->delete($this->find($user, $message), $user));
    }

    /**
     * Прочитать ответы
     *
     * Отмечает ответы магазина прочитанными — у менеджера появятся ✓✓.
     */
    public function read(#[CurrentUser] User $user, MarkChatRead $read): JsonResponse
    {
        return response()->json(['data' => ['marked' => $read->handle(Conversation::of($user), byStaff: false)]]);
    }

    private function find(User $user, int $id): ChatMessage
    {
        return Conversation::of($user)->messages()->findOrFail($id);
    }
}
