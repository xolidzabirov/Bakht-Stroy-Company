<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class GoogleSignInFailedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Не удалось войти через Google. Попробуйте ещё раз.', 'GOOGLE_SIGN_IN_FAILED', Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
