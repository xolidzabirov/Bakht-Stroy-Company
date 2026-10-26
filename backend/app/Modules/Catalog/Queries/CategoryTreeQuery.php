<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Queries;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Category tree (roots → children) with product counts, in 3 queries.
 */
final class CategoryTreeQuery
{
    private const CACHE_KEY = 'catalog:shop-tree';

    /**
     * Active categories and the number of products a guest can see.
     *
     * @return Collection<int, Category>
     */
    public function shop(): Collection
    {
        $roots = Category::query()->active()->roots()->ordered()
            ->with(['media', 'children' => fn ($q) => $q->active()->with('media')])
            ->get();

        return $this->withCounts($roots, Product::query()->visible());
    }

    /**
     * The shop tree as ready JSON data, cached. Plain arrays are cached on purpose:
     * Laravel does not unserialize objects from the cache (cache.serializable_classes).
     *
     * @param  callable(Collection<int, Category>): array<int, mixed>  $toArray
     * @return array<int, mixed>
     */
    public function shopCached(callable $toArray): array
    {
        return Cache::remember(self::CACHE_KEY, (int) config('shop.catalog_cache_ttl'), fn (): array => $toArray($this->shop()));
    }

    /**
     * Called whenever categories, products or category images change.
     */
    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * All categories (including hidden) with all products.
     *
     * @return Collection<int, Category>
     */
    public function admin(): Collection
    {
        $roots = Category::query()->roots()->ordered()
            ->with(['media', 'children.media'])
            ->get();

        return $this->withCounts($roots, Product::query());
    }

    /**
     * @param  Collection<int, Category>  $roots
     * @param  Builder<Product>  $products
     * @return Collection<int, Category>
     */
    private function withCounts(Collection $roots, Builder $products): Collection
    {
        /** @var array<int, int> $counts */
        $counts = $products->toBase()
            ->selectRaw('category_id, count(*) as total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id')
            ->map(fn ($total) => (int) $total)
            ->all();

        foreach ($roots as $root) {
            $childrenTotal = 0;

            foreach ($root->children as $child) {
                $child->setAttribute('products_total', $counts[$child->id] ?? 0);
                $childrenTotal += $counts[$child->id] ?? 0;
            }

            $root->setAttribute('products_total', ($counts[$root->id] ?? 0) + $childrenTotal);
        }

        return $roots;
    }
}
