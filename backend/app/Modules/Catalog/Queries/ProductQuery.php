<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Queries;

use App\Modules\Catalog\DTO\ProductFilterData;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Builder;

/**
 * Catalog filters, search and sorting — shared by the shop and the admin panel.
 */
final class ProductQuery
{
    /**
     * @return Builder<Product>
     */
    public function shop(ProductFilterData $filters): Builder
    {
        return $this->apply(Product::query()->visible(), $filters);
    }

    /**
     * @return Builder<Product>
     */
    public function admin(ProductFilterData $filters): Builder
    {
        return $this->apply(Product::query(), $filters)
            ->when($filters->isActive !== null, fn (Builder $q) => $q->where('products.is_active', $filters->isActive));
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    private function apply(Builder $query, ProductFilterData $filters): Builder
    {
        $query->with(['category', 'media']);

        if ($filters->category !== null) {
            $category = Category::query()->where('slug', $filters->category)->first();

            // Unknown category → empty list rather than an error.
            $query->whereIn('category_id', $category?->selfAndDescendantIds() ?? []);
        }

        if ($filters->search !== null && $filters->search !== '') {
            $this->search($query, $filters->search);
        }

        $query
            ->when($filters->priceMin !== null, fn (Builder $q) => $q->where('price', '>=', $filters->priceMin))
            ->when($filters->priceMax !== null, fn (Builder $q) => $q->where('price', '<=', $filters->priceMax))
            ->when($filters->inStock, fn (Builder $q) => $q->whereColumn('stock', '>=', 'min_order_qty'))
            ->when($filters->featured, fn (Builder $q) => $q->where('is_featured', true));

        return $this->sort($query, $filters->sort);
    }

    /**
     * Russian full-text search plus a substring match on name and SKU,
     * so both "цементы" and "м50" find "Цемент М500".
     *
     * @param  Builder<Product>  $query
     */
    private function search(Builder $query, string $search): void
    {
        $like = '%'.addcslashes(mb_strtolower(trim($search)), '%_\\').'%';

        $query->where(function (Builder $q) use ($search, $like) {
            $q->whereRaw("to_tsvector('russian', name || ' ' || coalesce(description, '')) @@ plainto_tsquery('russian', ?)", [$search])
                ->orWhereRaw('lower(name) like ?', [$like])
                ->orWhereRaw('lower(sku) like ?', [$like]);
        });
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    private function sort(Builder $query, string $sort): Builder
    {
        return match ($sort) {
            'price' => $query->orderBy('price')->orderBy('id'),
            '-price' => $query->orderByDesc('price')->orderBy('id'),
            'new' => $query->orderByDesc('created_at')->orderByDesc('id'),
            'name' => $query->orderBy('name')->orderBy('id'),
            // popular: featured first, then most viewed.
            default => $query->orderByDesc('is_featured')->orderByDesc('views_count')->orderBy('id'),
        };
    }
}
