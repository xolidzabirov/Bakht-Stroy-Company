<?php

declare(strict_types=1);

namespace App\Modules\Favorite\Http\Controllers;

use App\Modules\Catalog\Http\Resources\ProductListResource;
use App\Modules\Catalog\Models\Product;
use App\Modules\Favorite\Actions\ToggleFavorite;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Избранное', weight: 4)]
final class FavoriteController extends Controller
{
    /**
     * Мои избранные товары
     *
     * Сначала добавленные последними. Скрытые и удалённые товары не показываются.
     */
    public function index(Request $request, #[CurrentUser] User $user): AnonymousResourceCollection
    {
        $products = Product::query()->visible()
            ->with(['category', 'media'])
            ->join('favorites', fn ($join) => $join->on('favorites.product_id', '=', 'products.id')->where('favorites.user_id', $user->id))
            ->orderByDesc('favorites.created_at')
            ->select('products.*')
            ->paginate(min(max($request->integer('per_page', 20), 1), 60))
            ->withQueryString();

        return ProductListResource::collection($products);
    }

    /**
     * Добавить в избранное
     *
     * Повторное добавление ничего не меняет.
     */
    public function store(#[CurrentUser] User $user, int $product, ToggleFavorite $toggle): Response
    {
        $model = Product::query()->visible()->whereKey($product)->first();

        if ($model === null) {
            throw new NotFoundHttpException;
        }

        $toggle->add($user, $model);

        return response()->noContent();
    }

    /**
     * Убрать из избранного
     */
    public function destroy(#[CurrentUser] User $user, int $product, ToggleFavorite $toggle): Response
    {
        $toggle->remove($user, $product);

        return response()->noContent();
    }
}
