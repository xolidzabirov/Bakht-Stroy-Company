<?php

declare(strict_types=1);

namespace App\Modules\Order\Exceptions;

use App\Modules\Order\Enums\OrderStatus;
use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class InvalidStatusTransitionException extends DomainException
{
    public function __construct(OrderStatus $from = OrderStatus::Completed, OrderStatus $to = OrderStatus::New)
    {
        parent::__construct(
            "Нельзя перевести заказ из статуса «{$from->label()}» в «{$to->label()}».",
            'INVALID_STATUS_TRANSITION',
            Response::HTTP_CONFLICT,
            ['allowed' => array_map(fn (OrderStatus $status) => $status->value, $from->nextStatuses())],
        );
    }
}
