<?php

declare(strict_types=1);

namespace App\Modules\Chat\Support;

use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

/**
 * Chat files live under chat/{random uuid}/ instead of the default storage/{id}/,
 * so nobody can walk through other customers' photos and documents by changing a number.
 */
final class ChatMediaPathGenerator implements PathGenerator
{
    public function getPath(Media $media): string
    {
        return "chat/{$media->uuid}/";
    }

    public function getPathForConversions(Media $media): string
    {
        return $this->getPath($media).'conversions/';
    }

    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->getPath($media).'responsive/';
    }
}
