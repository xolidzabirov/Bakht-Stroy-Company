<?php

declare(strict_types=1);

namespace App\Modules\Cart\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class NotEnoughStockException extends DomainException
{
    public function __construct(int $available = 0, string $unit = 'шт')
    {
        parent::__construct(
            "Недостаточно товара на складе: доступно {$available} {$unit}.",
            'NOT_ENOUGH_STOCK',
            Response::HTTP_CONFLICT,
            ['available' => $available],
        );
    }
}
