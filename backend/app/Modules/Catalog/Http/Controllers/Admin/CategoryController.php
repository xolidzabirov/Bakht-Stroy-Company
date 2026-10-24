<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers\Admin;

use App\Modules\Catalog\Actions\DeleteCategory;
use App\Modules\Catalog\Actions\ReorderCategories;
use App\Modules\Catalog\Actions\SaveCategory;
use App\Modules\Catalog\Exceptions\CategoryNotEmptyException;
use App\Modules\Catalog\Exceptions\InvalidCategoryParentException;
use App\Modules\Catalog\Http\Requests\Admin\ReorderCategoriesRequest;
use App\Modules\Catalog\Http\Requests\Admin\SaveCategoryRequest;
use App\Modules\Catalog\Http\Requests\Admin\UploadCategoryImageRequest;
use App\Modules\Catalog\Http\Resources\CategoryResource;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Queries\CategoryTreeQuery;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

#[Group('Админ: категории', weight: 10)]
final class CategoryController extends Controller
{
    /**
     * Все категории
     *
     * Дерево всех категорий, включая скрытые, с количеством товаров.
     */
    public function index(CategoryTreeQuery $tree): AnonymousResourceCollection
    {
        return CategoryResource::collection($tree->admin());
    }

    /**
     * Создать категорию
     *
     * @throws InvalidCategoryParentException
     */
    public function store(SaveCategoryRequest $request, SaveCategory $saveCategory): JsonResponse
    {
        return CategoryResource::make($saveCategory->handle($request->toData()))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Категория
     */
    public function show(Category $category): CategoryResource
    {
        return CategoryResource::make($category->load(['media', 'parent', 'children.media']));
    }

    /**
     * Изменить категорию
     *
     * Можно передать только изменённые поля. Slug при переименовании не меняется.
     *
     * @throws InvalidCategoryParentException
     */
    public function update(SaveCategoryRequest $request, Category $category, SaveCategory $saveCategory): CategoryResource
    {
        return CategoryResource::make($saveCategory->handle($request->toData($category), $category)->load('media'));
    }

    /**
     * Удалить категорию
     *
     * Только пустую: без товаров и подкатегорий. Иначе 409 — скройте её через is_active.
     *
     * @throws CategoryNotEmptyException
     */
    public function destroy(Category $category, DeleteCategory $deleteCategory): Response
    {
        $deleteCategory->handle($category);

        return response()->noContent();
    }

    /**
     * Изменить порядок категорий
     */
    public function reorder(ReorderCategoriesRequest $request, ReorderCategories $reorderCategories): Response
    {
        $reorderCategories->handle($request->items());

        return response()->noContent();
    }

    /**
     * Загрузить картинку категории
     *
     * multipart/form-data, поле image. Заменяет текущую картинку.
     */
    public function uploadImage(UploadCategoryImageRequest $request, Category $category): CategoryResource
    {
        $category->addMediaFromRequest('image')
            ->usingName($category->name)
            ->toMediaCollection(Category::IMAGE_COLLECTION);

        return CategoryResource::make($category->load(['media', 'parent', 'children']));
    }

    /**
     * Удалить картинку категории
     */
    public function deleteImage(Category $category): Response
    {
        $category->clearMediaCollection(Category::IMAGE_COLLECTION);

        return response()->noContent();
    }
}
