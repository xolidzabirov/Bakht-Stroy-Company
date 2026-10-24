<?php

declare(strict_types=1);

namespace App\Modules\Favorite\Support;

use App\Modules\Favorite\Models\Favorite;
use App\Shared\Contracts\FavoriteProducts;
use Illuminate\Support\Facades\Auth;

/**
 * Loads the favorite product ids of the current user once per request (no N+1 in lists).
 * Works on public routes too: the Bearer token is read when it is sent.
 */
final class CurrentUserFavorites implements FavoriteProducts
{
    /**
     * Favorite product ids per user id: [userId => [productId => true]].
     *
     * @var array<int, array<int, bool>>
     */
    private array $cache = [];

    public function isFavorite(int $productId): bool
    {
        $userId = Auth::guard('sanctum')->id();

        if ($userId === null) {
            return false;
        }

        $this->cache[(int) $userId] ??= Favorite::query()
            ->where('user_id', $userId)
            ->pluck('product_id')
            ->mapWithKeys(fn ($id) => [(int) $id => true])
            ->all();

        return isset($this->cache[(int) $userId][$productId]);
    }

    public function forget(int $userId): void
    {
        unset($this->cache[$userId]);
    }
}
