<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers\Admin;

use App\Modules\Catalog\Actions\SaveProduct;
use App\Modules\Catalog\Http\Requests\Admin\AdminProductIndexRequest;
use App\Modules\Catalog\Http\Requests\Admin\SaveProductRequest;
use App\Modules\Catalog\Http\Requests\Admin\UpdateStockRequest;
use App\Modules\Catalog\Http\Resources\AdminProductResource;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Queries\ProductQuery;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

#[Group('Админ: товары', weight: 11)]
final class ProductController extends Controller
{
    /**
     * Все товары
     *
     * Включая скрытые. Те же фильтры, что в каталоге, плюс is_active. Сортировка по умолчанию — new.
     */
    public function index(AdminProductIndexRequest $request, ProductQuery $query): AnonymousResourceCollection
    {
        $filters = $request->toFilters();

        return AdminProductResource::collection(
            $query->admin($filters)->paginate($filters->perPage)->withQueryString(),
        );
    }

    /**
     * Создать товар
     */
    public function store(SaveProductRequest $request, SaveProduct $saveProduct): JsonResponse
    {
        return AdminProductResource::make($saveProduct->handle($request->toData()))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Товар
     */
    public function show(Product $product): AdminProductResource
    {
        return AdminProductResource::make($product->load(['category.parent', 'media']));
    }

    /**
     * Изменить товар
     *
     * Можно передать только изменённые поля. Slug при переименовании не меняется.
     */
    public function update(SaveProductRequest $request, Product $product, SaveProduct $saveProduct): AdminProductResource
    {
        return AdminProductResource::make($saveProduct->handle($request->toData($product), $product));
    }

    /**
     * Удалить товар
     *
     * Товар скрывается из каталога и админки (мягкое удаление), старые заказы сохраняют его данные.
     */
    public function destroy(Product $product): Response
    {
        $product->delete();

        return response()->noContent();
    }

    /**
     * Изменить остаток
     */
    public function updateStock(UpdateStockRequest $request, Product $product): AdminProductResource
    {
        $product->update(['stock' => $request->integer('stock')]);

        return AdminProductResource::make($product->load(['category.parent', 'media']));
    }

    /**
     * Заканчивающиеся товары
     *
     * Активные товары с остатком не больше порога LOW_STOCK_THRESHOLD (по умолчанию 10), меньше остаток — выше.
     */
    public function lowStock(): AnonymousResourceCollection
    {
        $products = Product::query()->active()
            ->with(['category.parent', 'media'])
            ->where('stock', '<=', (int) config('shop.low_stock_threshold'))
            ->orderBy('stock')
            ->orderBy('name')
            ->limit(100)
            ->get();

        return AdminProductResource::collection($products);
    }
}
