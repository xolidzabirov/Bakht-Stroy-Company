<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class CategoryNotEmptyException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Нельзя удалить категорию, в которой есть товары или подкатегории. Перенесите их или скройте категорию.',
            'CATEGORY_NOT_EMPTY',
            Response::HTTP_CONFLICT,
        );
    }
}
