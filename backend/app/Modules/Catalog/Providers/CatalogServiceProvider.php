<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Providers;

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Queries\CategoryTreeQuery;
use App\Shared\Providers\ModuleServiceProvider;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class CatalogServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        // The cached category tree shows names, images and product counts: drop it on any change.
        foreach ([Category::class, Product::class] as $model) {
            $model::saved(fn () => CategoryTreeQuery::forget());
            $model::deleted(fn () => CategoryTreeQuery::forget());
        }

        $forgetForCategoryImage = function (Media $media): void {
            if ($media->model_type === (new Category)->getMorphClass()) {
                CategoryTreeQuery::forget();
            }
        };

        Media::saved($forgetForCategoryImage);
        Media::deleted($forgetForCategoryImage);
    }
}
