<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers;

use App\Modules\Catalog\Http\Requests\ProductIndexRequest;
use App\Modules\Catalog\Http\Resources\ProductListResource;
use App\Modules\Catalog\Http\Resources\ProductResource;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Queries\ProductQuery;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Каталог', weight: 2)]
final class ProductController extends Controller
{
    /**
     * Список товаров
     *
     * Каталог с фильтрами, поиском, сортировкой и пагинацией. Доступно гостям.
     */
    public function index(ProductIndexRequest $request, ProductQuery $query): AnonymousResourceCollection
    {
        $filters = $request->toFilters();

        return ProductListResource::collection(
            $query->shop($filters)->paginate($filters->perPage)->withQueryString(),
        );
    }

    /**
     * Товар
     *
     * Страница товара по slug: фото, характеристики, категория. Каждый просмотр увеличивает счётчик популярности.
     */
    public function show(Product $product): ProductResource
    {
        $product->load(['category.parent', 'media']);

        if (! $product->isVisible()) {
            throw new NotFoundHttpException;
        }

        // Without touching updated_at.
        Product::query()->whereKey($product->id)->toBase()->increment('views_count');

        return ProductResource::make($product);
    }

    /**
     * Похожие товары
     *
     * До 8 товаров из той же категории, сначала те, что в наличии.
     */
    public function related(Product $product): AnonymousResourceCollection
    {
        $product->load('category');

        if (! $product->isVisible()) {
            throw new NotFoundHttpException;
        }

        $related = Product::query()->visible()
            ->with(['category', 'media'])
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->orderByRaw('stock >= min_order_qty desc')
            ->orderByDesc('views_count')
            ->limit(8)
            ->get();

        return ProductListResource::collection($related);
    }
}
