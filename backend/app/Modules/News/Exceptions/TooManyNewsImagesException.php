<?php

declare(strict_types=1);

namespace App\Modules\News\Exceptions;

use App\Modules\News\Models\News;
use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class TooManyNewsImagesException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'В галерее новости может быть не больше '.News::MAX_GALLERY_IMAGES.' фото.',
            'TOO_MANY_IMAGES',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
