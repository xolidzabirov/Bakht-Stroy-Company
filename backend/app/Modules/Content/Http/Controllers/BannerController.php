<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Controllers;

use App\Modules\Content\Http\Requests\SaveBannerRequest;
use App\Modules\Content\Http\Resources\BannerResource;
use App\Modules\Content\Models\Banner;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class BannerController extends Controller
{
    /**
     * Баннеры главной страницы
     *
     * Активные баннеры, у которых сейчас период показа, по порядку. Доступно гостям.
     */
    #[Group('Магазин', weight: 8)]
    public function public(): AnonymousResourceCollection
    {
        return BannerResource::collection(Banner::query()->showing()->with('media')->get());
    }

    /**
     * Все баннеры
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function index(): AnonymousResourceCollection
    {
        return BannerResource::collection(Banner::query()->with('media')->orderBy('sort_order')->latest('id')->get());
    }

    /**
     * Создать баннер
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function store(SaveBannerRequest $request): JsonResponse
    {
        return BannerResource::make(Banner::query()->create($request->validated())->load('media'))->response()->setStatusCode(201);
    }

    /**
     * Изменить баннер
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function update(SaveBannerRequest $request, Banner $banner): BannerResource
    {
        $banner->update($request->validated());

        return BannerResource::make($banner->load('media'));
    }

    /**
     * Удалить баннер
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function destroy(Banner $banner): Response
    {
        $banner->delete();

        return response()->noContent();
    }

    /**
     * Загрузить картинку баннера
     *
     * multipart/form-data: image — файл (JPG, PNG, WebP до 8 МБ), variant — desktop (по умолчанию, 1920×600)
     * или mobile (800×800). Без мобильной картинки на телефоне показывается обрезанная основная.
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function uploadImage(Request $request, Banner $banner): BannerResource
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'variant' => ['nullable', 'in:desktop,mobile'],
        ]);

        $collection = $request->input('variant') === 'mobile' ? Banner::MOBILE_IMAGE_COLLECTION : Banner::IMAGE_COLLECTION;

        $banner->addMediaFromRequest('image')->usingName($banner->title)->toMediaCollection($collection);

        return BannerResource::make($banner->load('media'));
    }
}
