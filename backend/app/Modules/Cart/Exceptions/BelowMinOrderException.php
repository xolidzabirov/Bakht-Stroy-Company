<?php

declare(strict_types=1);

namespace App\Modules\Cart\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class BelowMinOrderException extends DomainException
{
    public function __construct(int $minimum = 1, string $unit = 'шт')
    {
        parent::__construct(
            "Минимальный заказ этого товара — {$minimum} {$unit}.",
            'BELOW_MIN_ORDER',
            Response::HTTP_UNPROCESSABLE_ENTITY,
            ['min_order_qty' => $minimum],
        );
    }
}
