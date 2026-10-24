<?php

declare(strict_types=1);

namespace App\Modules\Account\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class AccountHasActiveOrdersException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Нельзя удалить аккаунт, пока есть незавершённые заказы. Дождитесь их выполнения или отмените.',
            'ACCOUNT_HAS_ACTIVE_ORDERS',
            Response::HTTP_CONFLICT,
        );
    }
}
