<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Controllers\Admin;

use App\Modules\News\Actions\AttachNewsImages;
use App\Modules\News\Actions\SaveNews;
use App\Modules\News\Exceptions\TooManyNewsImagesException;
use App\Modules\News\Http\Requests\Admin\AdminNewsIndexRequest;
use App\Modules\News\Http\Requests\Admin\SaveNewsRequest;
use App\Modules\News\Http\Requests\Admin\UploadNewsCoverRequest;
use App\Modules\News\Http\Requests\Admin\UploadNewsImagesRequest;
use App\Modules\News\Http\Resources\AdminNewsResource;
use App\Modules\News\Models\News;
use App\Modules\News\Support\NewsSearch;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Админ: новости', weight: 12)]
final class NewsController extends Controller
{
    /**
     * Все новости
     *
     * Включая черновики и запланированные. Фильтры: status, type, search.
     */
    public function index(AdminNewsIndexRequest $request): AnonymousResourceCollection
    {
        $query = News::query()->with(['media', 'author']);

        match ($request->input('status')) {
            'draft' => $query->where('is_published', false),
            'scheduled' => $query->where('is_published', true)->where('published_at', '>', now()),
            'published' => $query->published(),
            default => null,
        };

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        NewsSearch::apply($query, $request->input('search'));

        return AdminNewsResource::collection(
            $query->latest('id')->paginate($request->integer('per_page', 20))->withQueryString(),
        );
    }

    /**
     * Создать новость
     *
     * По умолчанию — черновик. Для публикации is_published=true (дата — сейчас или published_at).
     */
    public function store(SaveNewsRequest $request, #[CurrentUser] User $user, SaveNews $saveNews): JsonResponse
    {
        return AdminNewsResource::make($saveNews->handle($request->toData(), author: $user))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Новость
     */
    public function show(News $news): AdminNewsResource
    {
        return AdminNewsResource::make($news->load(['media', 'author', 'products' => fn ($q) => $q->with(['category', 'media'])]));
    }

    /**
     * Изменить новость
     *
     * Можно передать только изменённые поля. Slug при переименовании не меняется.
     */
    public function update(SaveNewsRequest $request, News $news, SaveNews $saveNews): AdminNewsResource
    {
        $news = $saveNews->handle($request->toData($news), $news);

        return AdminNewsResource::make($news->load(['products' => fn ($q) => $q->with(['category', 'media'])]));
    }

    /**
     * Удалить новость
     */
    public function destroy(News $news): Response
    {
        $news->delete();

        return response()->noContent();
    }

    /**
     * Загрузить обложку
     *
     * multipart/form-data, поле image. Заменяет текущую.
     */
    public function uploadCover(UploadNewsCoverRequest $request, News $news, AttachNewsImages $images): AdminNewsResource
    {
        $file = $request->file('image');
        abort_unless($file instanceof UploadedFile, 422);

        return AdminNewsResource::make($images->cover($news, $file)->load(['author', 'products']));
    }

    /**
     * Удалить обложку
     */
    public function deleteCover(News $news): Response
    {
        $news->clearMediaCollection(News::COVER_COLLECTION);

        return response()->noContent();
    }

    /**
     * Добавить фото в галерею
     *
     * multipart/form-data, поле images[] (можно несколько), до 20 фото.
     *
     * @throws TooManyNewsImagesException
     */
    public function uploadGallery(UploadNewsImagesRequest $request, News $news, AttachNewsImages $images): AdminNewsResource
    {
        return AdminNewsResource::make($images->gallery($news, $request->images())->load(['author', 'products']));
    }

    /**
     * Удалить фото из галереи
     */
    public function deleteGalleryImage(News $news, int $media): Response
    {
        $image = $news->getMedia(News::GALLERY_COLLECTION)->firstWhere('id', $media);

        if ($image === null) {
            throw new NotFoundHttpException;
        }

        $image->delete();

        return response()->noContent();
    }
}
