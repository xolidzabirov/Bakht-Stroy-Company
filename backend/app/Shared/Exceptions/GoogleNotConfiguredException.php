<?php

declare(strict_types=1);

namespace App\Shared\Exceptions;

use Symfony\Component\HttpFoundation\Response;

final class GoogleNotConfiguredException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Вход через Google ещё не настроен.', 'GOOGLE_NOT_CONFIGURED', Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
