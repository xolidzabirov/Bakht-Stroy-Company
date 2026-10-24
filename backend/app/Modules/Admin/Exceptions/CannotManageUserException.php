<?php

declare(strict_types=1);

namespace App\Modules\Admin\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class CannotManageUserException extends DomainException
{
    public function __construct(string $message = 'Нельзя изменить этого пользователя.')
    {
        parent::__construct($message, 'CANNOT_MANAGE_USER', Response::HTTP_CONFLICT);
    }
}
