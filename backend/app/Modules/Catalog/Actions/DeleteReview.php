<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Models\Review;
use App\Modules\Catalog\Support\ProductRating;
use App\Shared\Support\PublicCache;
use Illuminate\Support\Facades\DB;

/** The shop team removes a review: the stars of the product are counted again without it. */
final class DeleteReview
{
    public function handle(Review $review): void
    {
        DB::transaction(function () use ($review): void {
            $review->delete();

            ProductRating::refresh($review->product_id);
        });

        PublicCache::flush();
    }
}
