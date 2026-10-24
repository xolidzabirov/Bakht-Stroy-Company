<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class InvalidResetCodeException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Код неверный или устарел. Запросите новый код.', 'INVALID_RESET_CODE', Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
