<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class InvalidCredentialsException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Неверный логин или пароль.', 'INVALID_CREDENTIALS', Response::HTTP_UNAUTHORIZED);
    }
}
