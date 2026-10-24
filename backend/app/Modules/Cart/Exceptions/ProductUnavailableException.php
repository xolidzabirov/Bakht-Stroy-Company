<?php

declare(strict_types=1);

namespace App\Modules\Cart\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class ProductUnavailableException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Товар больше не продаётся.', 'PRODUCT_UNAVAILABLE', Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
