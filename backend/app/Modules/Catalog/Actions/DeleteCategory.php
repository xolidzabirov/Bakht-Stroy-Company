<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Exceptions\CategoryNotEmptyException;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;

final class DeleteCategory
{
    public function handle(Category $category): void
    {
        $hasProducts = Product::withTrashed()->where('category_id', $category->id)->exists();

        if ($hasProducts || $category->children()->exists()) {
            throw new CategoryNotEmptyException;
        }

        $category->delete();
    }
}
