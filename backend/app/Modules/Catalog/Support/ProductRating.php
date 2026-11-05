<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Support;

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\Review;

/** The stars of a product: what its reviews add up to. */
final class ProductRating
{
    /**
     * Writes the average and the count on the product. Past the model: it is not an edit of the product,
     * its date stays and an open admin form is not rebuilt.
     */
    public static function refresh(int $productId): void
    {
        $count = Review::query()->where('product_id', $productId)->count();
        $average = $count > 0 ? (float) Review::query()->where('product_id', $productId)->avg('rating') : null;

        Product::withTrashed()->whereKey($productId)->toBase()->update([
            'reviews_count' => $count,
            'rating' => $average === null ? null : round($average, 2),
        ]);
    }

    /**
     * @return array{average: float|null, count: int, stars: array<string, int>}
     */
    public static function summary(int $productId): array
    {
        /** @var array<int, int> $byStars */
        $byStars = Review::query()
            ->where('product_id', $productId)
            ->selectRaw('rating, count(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating')
            ->map(fn ($total): int => (int) $total)
            ->all();

        $stars = [];
        $count = 0;
        $sum = 0;

        foreach (range(Review::MAX_RATING, Review::MIN_RATING) as $rating) {
            $total = $byStars[$rating] ?? 0;
            $stars[(string) $rating] = $total;
            $count += $total;
            $sum += $rating * $total;
        }

        return [
            'average' => $count > 0 ? round($sum / $count, 1) : null,
            'count' => $count,
            'stars' => $stars,
        ];
    }
}
