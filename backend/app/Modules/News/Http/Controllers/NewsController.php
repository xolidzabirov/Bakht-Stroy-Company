<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Controllers;

use App\Modules\News\Enums\NewsType;
use App\Modules\News\Http\Requests\NewsIndexRequest;
use App\Modules\News\Http\Resources\NewsListResource;
use App\Modules\News\Http\Resources\NewsResource;
use App\Modules\News\Models\News;
use App\Modules\News\Support\NewsSearch;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Новости', weight: 7)]
final class NewsController extends Controller
{
    /**
     * Список новостей
     *
     * Опубликованные новости, акции и статьи: закреплённые сверху, затем новые. Доступно гостям.
     */
    public function index(NewsIndexRequest $request): AnonymousResourceCollection
    {
        $query = News::query()->published()->with('media');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        NewsSearch::apply($query, $request->input('search'));

        return NewsListResource::collection(
            $query->orderByDesc('is_pinned')->orderByDesc('published_at')->orderByDesc('id')
                ->paginate($request->integer('per_page', 12))
                ->withQueryString(),
        );
    }

    /**
     * Типы новостей
     *
     * Для вкладок «Новости / Акции / Статьи» с количеством опубликованных.
     */
    public function types(): JsonResponse
    {
        $counts = News::query()->published()->toBase()->selectRaw('type, count(*) as total')->groupBy('type')->pluck('total', 'type');

        return response()->json(['data' => collect(NewsType::cases())->map(fn (NewsType $type) => [
            'value' => $type->value,
            'label' => $type->label(),
            'count' => (int) ($counts[$type->value] ?? 0),
        ])->all()]);
    }

    /**
     * Новость
     *
     * Полный текст, галерея, видео, товары из новости, предыдущая / следующая и похожие новости.
     * Просмотр считает отдельный запрос `POST /news/{slug}/view`, поэтому страницу можно кэшировать.
     */
    public function show(string $slug): NewsResource
    {
        $news = News::query()->published()
            ->with(['media', 'products' => fn ($q) => $q->with(['category', 'media'])])
            ->where('slug', $slug)
            ->first();

        if ($news === null) {
            throw new NotFoundHttpException;
        }

        $resource = NewsResource::make($news);
        $resource->around = [
            'previous' => $this->neighbour($news, older: true),
            'next' => $this->neighbour($news, older: false),
            'related' => News::query()->published()->with('media')
                ->where('type', $news->type)->whereKeyNot($news->id)
                ->latest('published_at')->limit(3)->get(),
        ];

        return $resource;
    }

    /**
     * Засчитать просмотр новости
     *
     * Сайт отправляет его из браузера, когда новость открыта.
     */
    public function view(string $slug): Response
    {
        $updated = News::query()->published()->where('slug', $slug)->toBase()->increment('views_count');

        if ($updated === 0) {
            throw new NotFoundHttpException;
        }

        return response()->noContent();
    }

    private function neighbour(News $news, bool $older): ?News
    {
        return News::query()->published()
            ->where(fn (Builder $q) => $q
                ->where('published_at', $older ? '<' : '>', $news->published_at)
                ->orWhere(fn (Builder $same) => $same->where('published_at', $news->published_at)->where('id', $older ? '<' : '>', $news->id)))
            ->orderBy('published_at', $older ? 'desc' : 'asc')
            ->orderBy('id', $older ? 'desc' : 'asc')
            ->first(['id', 'title', 'slug', 'published_at']);
    }
}
