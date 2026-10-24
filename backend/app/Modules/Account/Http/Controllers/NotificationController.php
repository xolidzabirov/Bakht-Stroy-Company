<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Controllers;

use App\Modules\Account\Http\Resources\NotificationResource;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Личный кабинет', weight: 6)]
final class NotificationController extends Controller
{
    /**
     * Мои уведомления
     *
     * Новые сверху. В meta.unread_count — сколько непрочитанных.
     */
    #[QueryParameter('unread', description: 'Только непрочитанные', type: 'bool')]
    #[QueryParameter('per_page', description: 'На странице, до 50', type: 'int', example: 20)]
    public function index(Request $request, #[CurrentUser] User $user): AnonymousResourceCollection
    {
        $query = $request->boolean('unread') ? $user->unreadNotifications() : $user->notifications();

        return NotificationResource::collection(
            $query->latest()->paginate(min(max($request->integer('per_page', 20), 1), 50))->withQueryString(),
        )->additional(['meta' => ['unread_count' => $user->unreadNotifications()->count()]]);
    }

    /**
     * Отметить прочитанным
     */
    public function read(#[CurrentUser] User $user, string $id): Response
    {
        $notification = $user->notifications()->whereKey($id)->first();

        if ($notification === null) {
            throw new NotFoundHttpException;
        }

        $notification->markAsRead();

        return response()->noContent();
    }

    /**
     * Прочитать все
     */
    public function readAll(#[CurrentUser] User $user): Response
    {
        $user->unreadNotifications()->update(['read_at' => now()]);

        return response()->noContent();
    }
}
