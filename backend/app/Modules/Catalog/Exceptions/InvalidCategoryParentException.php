<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class InvalidCategoryParentException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Каталог двухуровневый: родителем может быть только корневая категория, и категория с подкатегориями не может стать подкатегорией.',
            'INVALID_CATEGORY_PARENT',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
