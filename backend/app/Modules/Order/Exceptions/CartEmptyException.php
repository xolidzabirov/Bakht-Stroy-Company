<?php

declare(strict_types=1);

namespace App\Modules\Order\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class CartEmptyException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Корзина пуста.', 'CART_EMPTY', Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
