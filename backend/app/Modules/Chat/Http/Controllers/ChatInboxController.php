<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Controllers;

use App\Modules\Chat\Actions\ChangeChatMessage;
use App\Modules\Chat\Actions\MarkChatRead;
use App\Modules\Chat\Actions\SendChatMessage;
use App\Modules\Chat\Http\Requests\SendMessageRequest;
use App\Modules\Chat\Http\Resources\ChatMessageResource;
use App\Modules\Chat\Http\Resources\ConversationResource;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Models\Conversation;
use App\Modules\Chat\Support\ChatHistory;
use App\Modules\Order\Models\Order;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Inbox of the shop team (manager, admin). Live updates: private channel chat.staff for the list,
 * chat.{id} for an open conversation.
 */
#[Group('Админ: чаты', weight: 15)]
final class ChatInboxController extends Controller
{
    /**
     * Диалоги
     *
     * Сначала с непрочитанными, потом по времени последнего сообщения. filter: all, unread, mine (закреплённые за мной).
     * В meta.unread_conversations — сколько диалогов ждут ответа.
     */
    #[QueryParameter('search', description: 'Имя, телефон или email покупателя', type: 'string')]
    #[QueryParameter('filter', description: 'all | unread | mine', type: 'string', example: 'all')]
    public function index(Request $request, #[CurrentUser] User $staff): AnonymousResourceCollection
    {
        $search = trim($request->string('search')->toString());
        $digits = (string) preg_replace('/\D+/', '', $search);
        $filter = $request->string('filter', 'all')->toString();
        $hasUnread = 'exists (select 1 from chat_messages m where m.conversation_id = chat_conversations.id and m.from_staff = false and m.read_at is null and m.deleted_at is null)';

        $conversations = Conversation::query()
            ->withUnread()
            ->with(['user', 'manager', 'lastMessage.media'])
            ->whereNotNull('last_message_at')
            ->when($search !== '', fn (Builder $query) => $query->whereHas('user', fn (Builder $user) => $user
                ->where('name', 'ilike', "%{$search}%")
                ->orWhere('email', 'ilike', "%{$search}%")
                ->when(strlen($digits) >= 3, fn (Builder $q) => $q->orWhere('phone', 'like', "%{$digits}%"))))
            ->when($filter === 'unread', fn (Builder $query) => $query->whereRaw($hasUnread))
            ->when($filter === 'mine', fn (Builder $query) => $query->where('manager_id', $staff->id))
            ->orderByRaw("{$hasUnread} desc")
            ->orderByDesc('last_message_at')
            ->paginate(30)
            ->withQueryString();

        return ConversationResource::collection($conversations)->additional(['meta' => [
            'unread_conversations' => Conversation::query()->whereRaw($hasUnread)->count(),
        ]]);
    }

    /**
     * Начать диалог с покупателем
     *
     * Например, из карточки пользователя. Если диалог уже есть — вернёт его.
     */
    public function start(Request $request): JsonResponse
    {
        $data = $request->validate(['user_id' => ['required', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')]]);
        $conversation = Conversation::of(User::query()->findOrFail($data['user_id']));

        return response()->json(['data' => ['id' => $conversation->id]]);
    }

    /**
     * Диалог и карточка покупателя
     *
     * Покупатель, ответственный менеджер, сколько заказов и на какую сумму, последние 5 заказов.
     */
    public function show(Conversation $conversation): JsonResponse
    {
        $conversation->loadMissing(['user', 'manager', 'lastMessage.media'])->loadCount([
            'messages as unread_for_staff' => fn (Builder $q) => ChatMessage::whereUnread($q, fromStaff: false),
        ]);
        $orders = Order::query()->where('user_id', $conversation->user_id);

        return response()->json(['data' => [
            ...ConversationResource::make($conversation)->resolve(),
            'client_since' => $conversation->user->created_at->toIso8601String(),
            'orders_count' => (clone $orders)->count(),
            /** Сумма выполненных заказов в дирамах. */
            'orders_spent' => (int) (clone $orders)->where('status', 'completed')->sum('total'),
            'recent_orders' => (clone $orders)->latest()->limit(5)->get()->map(fn (Order $order) => [
                'number' => $order->number,
                'status' => ['value' => $order->status->value, 'label' => $order->status->label()],
                'total' => $order->total,
                'created_at' => $order->created_at->toIso8601String(),
            ])->all(),
        ]]);
    }

    /**
     * Сообщения диалога
     */
    #[QueryParameter('before_id', description: 'Сообщения старше этого id', type: 'int')]
    #[QueryParameter('limit', description: 'Сколько, до 100', type: 'int', example: 30)]
    public function messages(Request $request, Conversation $conversation): AnonymousResourceCollection
    {
        return ChatHistory::page($conversation, $request);
    }

    /**
     * Ответить покупателю
     *
     * Первый ответ закрепляет диалог за отвечающим менеджером.
     */
    public function send(SendMessageRequest $request, Conversation $conversation, #[CurrentUser] User $staff, SendChatMessage $send): JsonResponse
    {
        $message = $send->handle($conversation, $staff, true, $request->payload(), $request->uploads());

        return ChatMessageResource::make($message)->response()->setStatusCode(201);
    }

    /**
     * Изменить своё сообщение
     */
    public function update(Request $request, Conversation $conversation, int $message, #[CurrentUser] User $staff, ChangeChatMessage $change): ChatMessageResource
    {
        $data = $request->validate(['body' => ['present', 'nullable', 'string', 'max:4000']]);

        return ChatMessageResource::make($change->edit($this->find($conversation, $message), $staff, (string) ($data['body'] ?? '')));
    }

    /**
     * Удалить своё сообщение
     */
    public function destroy(Conversation $conversation, int $message, #[CurrentUser] User $staff, ChangeChatMessage $change): ChatMessageResource
    {
        return ChatMessageResource::make($change->delete($this->find($conversation, $message), $staff));
    }

    /**
     * Прочитать сообщения покупателя
     */
    public function read(Conversation $conversation, MarkChatRead $read): JsonResponse
    {
        return response()->json(['data' => ['marked' => $read->handle($conversation, byStaff: true)]]);
    }

    /**
     * Закрепить диалог за менеджером (только admin)
     *
     * manager_id — менеджер или администратор; null — снять закрепление.
     */
    public function assign(Request $request, Conversation $conversation): JsonResponse
    {
        $data = $request->validate(['manager_id' => ['present', 'nullable', 'integer']]);
        $managerId = $data['manager_id'];

        if ($managerId !== null) {
            $isStaff = User::query()->whereKey($managerId)->whereNull('blocked_at')
                ->role(array_map(fn (Role $role) => $role->value, Role::staff()))->exists();

            if (! $isStaff) {
                throw ValidationException::withMessages(['manager_id' => 'Выберите менеджера или администратора.']);
            }
        }

        $conversation->forceFill(['manager_id' => $managerId])->save();

        return response()->json(['data' => ['manager_id' => $managerId]]);
    }

    /**
     * Менеджеры для закрепления
     *
     * Активные менеджеры и администраторы.
     */
    public function staff(): JsonResponse
    {
        $staff = User::query()->role(array_map(fn (Role $role) => $role->value, Role::staff()))
            ->whereNull('blocked_at')->orderBy('name')->get(['id', 'name']);

        return response()->json(['data' => $staff->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])->all()]);
    }

    private function find(Conversation $conversation, int $id): ChatMessage
    {
        return $conversation->messages()->findOrFail($id);
    }
}
