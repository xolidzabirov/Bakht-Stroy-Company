<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers;

use App\Modules\Catalog\Http\Resources\CategoryResource;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Queries\CategoryTreeQuery;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Каталог', weight: 2)]
final class CategoryController extends Controller
{
    /**
     * Дерево категорий
     *
     * Активные корневые категории с подкатегориями и количеством товаров. Доступно гостям.
     * Ответ кэшируется и обновляется при любом изменении каталога.
     */
    #[Response(200, 'Дерево категорий', type: 'array{data: list<CategoryResource>}')]
    public function index(Request $request, CategoryTreeQuery $tree): JsonResponse
    {
        $data = $tree->shopCached(fn ($categories) => CategoryResource::collection($categories)->resolve($request));

        return response()->json(['data' => $data]);
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
