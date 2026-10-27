<?php

declare(strict_types=1);

namespace App\Modules\Account\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

/**
 * The shop must never lose its admin (or a manager's history) to one click in the account settings.
 */
final class StaffAccountCannotBeDeletedException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Аккаунт администратора или менеджера нельзя удалить самому. Сначала администратор снимает роль сотрудника.',
            'STAFF_ACCOUNT_CANNOT_BE_DELETED',
            Response::HTTP_FORBIDDEN,
        );
    }
}
