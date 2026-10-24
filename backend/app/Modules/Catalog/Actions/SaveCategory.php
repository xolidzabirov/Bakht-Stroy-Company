<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\DTO\CategoryData;
use App\Modules\Catalog\Exceptions\InvalidCategoryParentException;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Support\UniqueSlug;

/**
 * Creates a category or updates an existing one, keeping the tree two-level.
 */
final class SaveCategory
{
    public function handle(CategoryData $data, ?Category $category = null): Category
    {
        $category ??= new Category;

        $this->ensureValidParent($data->parentId, $category);

        // Slug is kept on rename so links do not break; it changes only when sent explicitly.
        $slugSource = $data->slug ?: ($category->exists ? null : $data->name);

        $category->fill([
            'parent_id' => $data->parentId,
            'name' => $data->name,
            'description' => $data->description,
            'sort_order' => $data->sortOrder,
            'is_active' => $data->isActive,
        ]);

        if ($slugSource !== null) {
            $category->slug = UniqueSlug::for(Category::class, $slugSource, $category->exists ? $category->id : null);
        }

        $category->save();

        return $category->load(['parent', 'children']);
    }

    private function ensureValidParent(?int $parentId, Category $category): void
    {
        if ($parentId === null) {
            return;
        }

        $parent = Category::query()->find($parentId);

        $isInvalid = $parent === null
            || ! $parent->isRoot()
            || ($category->exists && $parent->id === $category->id)
            || ($category->exists && $category->children()->exists());

        if ($isInvalid) {
            throw new InvalidCategoryParentException;
        }
    }
}
