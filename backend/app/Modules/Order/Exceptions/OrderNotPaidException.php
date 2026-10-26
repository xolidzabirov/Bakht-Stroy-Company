<?php

declare(strict_types=1);

namespace App\Modules\Order\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class OrderNotPaidException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Заказ ещё не оплачен. Отметьте оплату (наличные в офисе или перевод на карту), затем отправляйте заказ.',
            'ORDER_NOT_PAID',
            Response::HTTP_CONFLICT,
        );
    }
}
