<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Exceptions;

use App\Modules\Catalog\Models\Product;
use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class TooManyImagesException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'У товара может быть не больше '.Product::MAX_IMAGES.' фото.',
            'TOO_MANY_IMAGES',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
