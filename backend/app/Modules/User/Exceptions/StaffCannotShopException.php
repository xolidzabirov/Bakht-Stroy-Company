<?php

declare(strict_types=1);

namespace App\Modules\User\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class StaffCannotShopException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Сотрудники магазина не оформляют заказы, не пользуются корзиной и избранным. Для покупки войдите как покупатель.',
            'STAFF_CANNOT_SHOP',
            Response::HTTP_FORBIDDEN,
        );
    }
}
