<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class EmailNotDeliveredException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Не удалось отправить письмо с кодом. Проверьте адрес и попробуйте ещё раз через минуту.',
            'EMAIL_NOT_DELIVERED',
            Response::HTTP_SERVICE_UNAVAILABLE,
        );
    }
}
