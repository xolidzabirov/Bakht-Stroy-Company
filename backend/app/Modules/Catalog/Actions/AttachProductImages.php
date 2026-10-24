<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Exceptions\TooManyImagesException;
use App\Modules\Catalog\Models\Product;
use Illuminate\Http\UploadedFile;

final class AttachProductImages
{
    /**
     * @param  list<UploadedFile>  $files
     */
    public function handle(Product $product, array $files): Product
    {
        $current = $product->getMedia(Product::IMAGES_COLLECTION)->count();

        if ($current + count($files) > Product::MAX_IMAGES) {
            throw new TooManyImagesException;
        }

        foreach ($files as $file) {
            $product->addMedia($file)
                ->usingName($product->name)
                ->toMediaCollection(Product::IMAGES_COLLECTION);
        }

        return $product->load('media');
    }
}
