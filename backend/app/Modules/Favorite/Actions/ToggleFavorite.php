<?php

declare(strict_types=1);

namespace App\Modules\Favorite\Actions;

use App\Modules\Catalog\Models\Product;
use App\Modules\Favorite\Models\Favorite;
use App\Modules\User\Models\User;
use App\Shared\Contracts\FavoriteProducts;

/**
 * Add / remove a product from favorites. Both are idempotent.
 */
final class ToggleFavorite
{
    public function __construct(private FavoriteProducts $favorites) {}

    public function add(User $user, Product $product): void
    {
        Favorite::query()->insertOrIgnore(['user_id' => $user->id, 'product_id' => $product->id, 'created_at' => now()]);

        $this->favorites->forget($user->id);
    }

    public function remove(User $user, int $productId): void
    {
        Favorite::query()->where('user_id', $user->id)->where('product_id', $productId)->delete();

        $this->favorites->forget($user->id);
    }
}
