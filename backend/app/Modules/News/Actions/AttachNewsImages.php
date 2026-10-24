<?php

declare(strict_types=1);

namespace App\Modules\News\Actions;

use App\Modules\News\Exceptions\TooManyNewsImagesException;
use App\Modules\News\Models\News;
use Illuminate\Http\UploadedFile;

final class AttachNewsImages
{
    public function cover(News $news, UploadedFile $file): News
    {
        $news->addMedia($file)->usingName($news->title)->toMediaCollection(News::COVER_COLLECTION);

        return $news->load('media');
    }

    /**
     * @param  list<UploadedFile>  $files
     */
    public function gallery(News $news, array $files): News
    {
        if ($news->getMedia(News::GALLERY_COLLECTION)->count() + count($files) > News::MAX_GALLERY_IMAGES) {
            throw new TooManyNewsImagesException;
        }

        foreach ($files as $file) {
            $news->addMedia($file)->usingName($news->title)->toMediaCollection(News::GALLERY_COLLECTION);
        }

        return $news->load('media');
    }
}
