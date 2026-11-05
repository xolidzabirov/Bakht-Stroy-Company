<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers;

use App\Modules\Catalog\Actions\SaveReview;
use App\Modules\Catalog\Http\Requests\StoreReviewRequest;
use App\Modules\Catalog\Http\Resources\ReviewResource;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\Review;
use App\Modules\Catalog\Support\ProductRating;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Отзывы', weight: 3)]
final class ReviewController extends Controller
{
    /**
     * Отзывы о товаре
     *
     * Новые сверху. В summary — средняя оценка, количество и сколько отзывов на каждую оценку.
     */
    public function index(Request $request, Product $product): AnonymousResourceCollection
    {
        $this->ensureVisible($product);
        $request->validate(['per_page' => ['nullable', 'integer', 'min:1', 'max:50']]);

        $reviews = Review::query()
            ->where('product_id', $product->id)
            ->with('user')
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return ReviewResource::collection($reviews)->additional(['summary' => ProductRating::summary($product->id)]);
    }

    /**
     * Мой отзыв о товаре
     *
     * data = null, если покупатель ещё не писал.
     */
    public function mine(Product $product, #[CurrentUser] User $user): JsonResponse
    {
        $review = Review::query()->where('product_id', $product->id)->where('user_id', $user->id)->with('user')->first();

        return response()->json(['data' => $review ? ReviewResource::make($review)->resolve() : null]);
    }

    /**
     * Оставить отзыв
     *
     * Оценка и текст обязательны. Один покупатель — один отзыв на товар: повторная отправка заменяет прежний.
     */
    public function store(StoreReviewRequest $request, Product $product, #[CurrentUser] User $user, SaveReview $saveReview): JsonResponse
    {
        $this->ensureVisible($product);

        $review = $saveReview->handle($user, $product, $request->integer('rating'), trim($request->string('body')->toString()));

        return ReviewResource::make($review->load('user'))
            ->response()
            ->setStatusCode($review->wasRecentlyCreated ? 201 : 200);
    }

    private function ensureVisible(Product $product): void
    {
        if (! $product->isVisible()) {
            throw new NotFoundHttpException;
        }
    }
}
