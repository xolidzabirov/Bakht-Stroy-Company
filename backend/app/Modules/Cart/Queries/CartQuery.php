<?php

declare(strict_types=1);

namespace App\Modules\Cart\Queries;

use App\Modules\Cart\Models\CartItem;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Collection;

final class CartQuery
{
    /**
     * Cart lines of the user with products, oldest first.
     *
     * @return Collection<int, CartItem>
     */
    public function items(User $user): Collection
    {
        return CartItem::query()
            ->where('user_id', $user->id)
            ->with(['product.category', 'product.media'])
            ->orderBy('id')
            ->get();
    }
}
