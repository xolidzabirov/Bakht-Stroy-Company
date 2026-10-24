<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers;

use App\Modules\Catalog\Http\Resources\CategoryResource;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Queries\CategoryTreeQuery;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Каталог', weight: 2)]
final class CategoryController extends Controller
{
    /**
     * Дерево категорий
     *
     * Активные корневые категории с подкатегориями и количеством товаров. Доступно гостям.
     */
    public function index(CategoryTreeQuery $tree): AnonymousResourceCollection
    {
        return CategoryResource::collection($tree->shop());
    }

    /**
     * Категория
     *
     * Категория по slug: родитель (для «хлебных крошек») и активные подкатегории.
     */
    public function show(Category $category): CategoryResource
    {
        $category->load(['media', 'parent', 'children' => fn ($q) => $q->active()->with('media')]);

        if (! $category->is_active || ($category->parent && ! $category->parent->is_active)) {
            throw new NotFoundHttpException;
        }

        return CategoryResource::make($category);
    }
}
