<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\Review;
use App\Modules\Catalog\Support\ProductRating;
use App\Modules\User\Models\User;
use App\Shared\Support\PublicCache;
use Illuminate\Support\Facades\DB;

/** Publishes a customer's review; a second one from the same customer replaces the first. */
final class SaveReview
{
    public function handle(User $user, Product $product, int $rating, string $body): Review
    {
        $review = DB::transaction(function () use ($user, $product, $rating, $body): Review {
            $review = Review::query()->updateOrCreate(
                ['product_id' => $product->id, 'user_id' => $user->id],
                ['rating' => $rating, 'body' => $body],
            );

            ProductRating::refresh($product->id);

            return $review;
        });

        PublicCache::flush(); // The stars are on the public pages.

        return $review;
    }
}
