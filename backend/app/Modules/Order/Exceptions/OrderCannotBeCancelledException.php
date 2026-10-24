<?php

declare(strict_types=1);

namespace App\Modules\Order\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class OrderCannotBeCancelledException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Заказ уже в работе, отменить его можно только через менеджера.',
            'ORDER_CANNOT_BE_CANCELLED',
            Response::HTTP_CONFLICT,
        );
    }
}
