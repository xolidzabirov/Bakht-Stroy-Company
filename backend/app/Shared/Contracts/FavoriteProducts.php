<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

/**
 * Lets the catalog mark products as favorites of the current user
 * without depending on the Favorite module.
 */
interface FavoriteProducts
{
    /**
     * Whether the user of the current request (Bearer token, optional) saved the product.
     */
    public function isFavorite(int $productId): bool;

    /**
     * Drop cached favorites of a user after they change.
     */
    public function forget(int $userId): void;
}
