<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Controllers\Admin;

use App\Modules\Catalog\Actions\AttachProductImages;
use App\Modules\Catalog\Exceptions\TooManyImagesException;
use App\Modules\Catalog\Http\Requests\Admin\ReorderProductImagesRequest;
use App\Modules\Catalog\Http\Requests\Admin\UploadImagesRequest;
use App\Modules\Catalog\Http\Resources\AdminProductResource;
use App\Modules\Catalog\Models\Product;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Админ: товары', weight: 11)]
final class ProductImageController extends Controller
{
    /**
     * Загрузить фото товара
     *
     * multipart/form-data, поле images[] (можно несколько). Первое фото — главное.
     *
     * @throws TooManyImagesException
     */
    public function store(UploadImagesRequest $request, Product $product, AttachProductImages $attachImages): AdminProductResource
    {
        $attachImages->handle($product, $request->images());

        return AdminProductResource::make($product->load(['category.parent', 'media']));
    }

    /**
     * Изменить порядок фото товара
     *
     * Передаются все фото товара в новом порядке; первое становится главным.
     */
    public function reorder(ReorderProductImagesRequest $request, Product $product): AdminProductResource
    {
        $ids = $request->ids();
        $current = $product->getMedia(Product::IMAGES_COLLECTION)->pluck('id')->all();

        if (count($ids) !== count($current) || array_diff($ids, $current) !== []) {
            throw ValidationException::withMessages(['ids' => __('Передайте все фото этого товара, каждое один раз.')]);
        }

        Media::setNewOrder($ids);

        return AdminProductResource::make($product->load(['category.parent', 'media']));
    }

    /**
     * Удалить фото товара
     */
    public function destroy(Product $product, int $media): Response
    {
        $image = $product->getMedia(Product::IMAGES_COLLECTION)->firstWhere('id', $media);

        if ($image === null) {
            throw new NotFoundHttpException;
        }

        $image->delete();

        return response()->noContent();
    }
}
