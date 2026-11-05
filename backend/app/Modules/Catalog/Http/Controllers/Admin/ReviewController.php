<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers\Admin;

use App\Modules\Catalog\Actions\DeleteReview;
use App\Modules\Catalog\Http\Requests\Admin\AdminReviewIndexRequest;
use App\Modules\Catalog\Http\Resources\AdminReviewResource;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\Review;
use App\Modules\Catalog\Support\ProductRating;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

#[Group('Админ: отзывы', weight: 13)]
final class ReviewController extends Controller
{
    /**
     * Отзывы о товаре
     *
     * Все отзывы с авторами, новые сверху. Фильтр filter: negative (1–2 звезды) или positive (3–5 звёзд).
     */
    public function index(AdminReviewIndexRequest $request, Product $product): AnonymousResourceCollection
    {
        $filter = $request->string('filter')->toString();

        $reviews = Review::query()
            ->where('product_id', $product->id)
            ->with('user')
            ->when($filter === 'negative', fn (Builder $q) => $q->where('rating', '<=', Review::NEGATIVE_UP_TO))
            ->when($filter === 'positive', fn (Builder $q) => $q->where('rating', '>', Review::NEGATIVE_UP_TO))
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return AdminReviewResource::collection($reviews)->additional(['summary' => ProductRating::summary($product->id)]);
    }

    /**
     * Удалить отзыв
     *
     * Оценка товара пересчитывается без него.
     */
    public function destroy(Review $review, DeleteReview $deleteReview): Response
    {
        $deleteReview->handle($review);

        return response()->noContent();
    }
}
