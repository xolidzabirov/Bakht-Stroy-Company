<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class StaffUsesPasswordException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Сотрудники магазина входят по email и паролю.', 'STAFF_PASSWORD_ONLY', Response::HTTP_FORBIDDEN);
    }
}
