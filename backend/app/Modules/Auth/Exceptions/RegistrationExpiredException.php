<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class RegistrationExpiredException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Подтверждение номера устарело. Подтвердите номер ещё раз — это займёт минуту.',
            'REGISTRATION_EXPIRED',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
