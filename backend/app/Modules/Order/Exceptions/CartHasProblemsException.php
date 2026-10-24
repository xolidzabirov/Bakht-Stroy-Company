<?php

declare(strict_types=1);

namespace App\Modules\Order\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Some cart lines cannot be ordered (sold out, removed, below minimum).
 * details: [{ "cart_item_id": 5, "product_id": 2, "product_name": "...", "problem": "not_enough_stock", "available": 3 }]
 */
final class CartHasProblemsException extends DomainException
{
    /**
     * @param  list<array<string, mixed>>  $problems
     */
    public function __construct(array $problems = [])
    {
        parent::__construct(
            'Некоторые товары в корзине нельзя заказать: проверьте количество или удалите их.',
            'CART_HAS_PROBLEMS',
            Response::HTTP_CONFLICT,
            $problems,
        );
    }
}
