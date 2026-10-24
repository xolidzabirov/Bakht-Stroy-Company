<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Queries;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * Category tree (roots → children) with product counts, in 3 queries.
 */
final class CategoryTreeQuery
{
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
