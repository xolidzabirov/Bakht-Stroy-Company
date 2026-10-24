<?php

declare(strict_types=1);

namespace App\Modules\User\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class AccountBlockedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Аккаунт заблокирован. Обратитесь в поддержку.', 'ACCOUNT_BLOCKED', Response::HTTP_FORBIDDEN);
    }
}
