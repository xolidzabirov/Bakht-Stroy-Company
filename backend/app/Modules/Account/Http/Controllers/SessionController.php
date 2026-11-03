<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Controllers;

use App\Modules\Account\Http\Resources\SessionResource;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Личный кабинет', weight: 6)]
final class SessionController extends Controller
{
    /**
     * Мои устройства
     *
     * Где выполнен вход. Последние активные — сверху.
     */
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        return SessionResource::collection(
            $user->tokens()->orderByRaw('last_used_at desc nulls last')->latest('id')->get(),
        );
    }

    /**
     * Выйти на устройстве
     *
     * Удаляет вход на выбранном устройстве (можно и на текущем).
     */
    public function destroy(#[CurrentUser] User $user, int $id): Response
    {
        $deleted = $user->tokens()->whereKey($id)->delete();

        if ($deleted === 0) {
            throw new NotFoundHttpException;
        }

        return response()->noContent();
    }

    /**
     * Выйти на всех других устройствах
     *
     * Удаляет все входы, кроме текущего. Ответ — сколько устройств вышло.
     */
    public function destroyOthers(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $current = $request->user()?->currentAccessToken();

        $ended = $user->tokens()
            ->when($current instanceof PersonalAccessToken, fn (Builder $query) => $query->whereKeyNot($current->getKey()))
            ->delete();

        return response()->json(['ended' => $ended]);
    }
}
