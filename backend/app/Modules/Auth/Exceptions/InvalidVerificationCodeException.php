<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class InvalidVerificationCodeException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Код подтверждения неверный или устарел. Запросите новый код.',
            'INVALID_VERIFICATION_CODE',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
