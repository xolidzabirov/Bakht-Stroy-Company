<?php

declare(strict_types=1);

namespace App\Modules\Account\Exceptions;

use App\Modules\User\Models\Address;
use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class TooManyAddressesException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Можно сохранить не больше '.Address::MAX_PER_USER.' адресов.',
            'TOO_MANY_ADDRESSES',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
