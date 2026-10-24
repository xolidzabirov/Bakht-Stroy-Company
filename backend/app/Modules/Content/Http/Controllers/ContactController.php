<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Controllers;

use App\Modules\Content\Http\Requests\ContactRequest;
use App\Modules\Content\Http\Resources\ContactMessageResource;
use App\Modules\Content\Models\ContactMessage;
use App\Modules\Content\Notifications\NewContactMessageNotification;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

final class ContactController extends Controller
{
    /**
     * Написать нам
     *
     * Форма обратной связи. Доступно гостям, не больше 5 сообщений в час с одного адреса.
     * Админы и менеджеры получают уведомление.
     */
    #[Group('Магазин', weight: 8)]
    public function store(ContactRequest $request): JsonResponse
    {
        $message = ContactMessage::query()->create([
            ...$request->validated(),
            'user_id' => Auth::guard('sanctum')->id(),
            'ip' => $request->ip(),
        ]);

        $staff = User::query()->role(array_map(fn (Role $role) => $role->value, Role::staff()))->whereNull('blocked_at')->get();
        Notification::send($staff, new NewContactMessageNotification($message));

        return response()->json(['data' => [
            /** @example Спасибо! Мы свяжемся с вами в ближайшее время. */
            'message' => 'Спасибо! Мы свяжемся с вами в ближайшее время.',
        ]], 201);
    }

    /**
     * Сообщения обратной связи
     *
     * Новые сверху. В meta.unread_count — сколько непрочитанных.
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    #[QueryParameter('unread', description: 'Только непрочитанные', type: 'bool')]
    public function index(Request $request): AnonymousResourceCollection
    {
        $messages = ContactMessage::query()
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 20), 1), 100))
            ->withQueryString();

        return ContactMessageResource::collection($messages)
            ->additional(['meta' => ['unread_count' => ContactMessage::query()->whereNull('read_at')->count()]]);
    }

    /**
     * Отметить сообщение прочитанным
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function read(ContactMessage $message): ContactMessageResource
    {
        $message->forceFill(['read_at' => $message->read_at ?? now()])->save();

        return ContactMessageResource::make($message);
    }

    /**
     * Удалить сообщение
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function destroy(ContactMessage $message): Response
    {
        $message->delete();

        return response()->noContent();
    }
}
