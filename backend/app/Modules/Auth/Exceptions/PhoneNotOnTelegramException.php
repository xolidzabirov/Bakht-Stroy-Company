<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class PhoneNotOnTelegramException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'На этот номер не зарегистрирован Telegram. Укажите номер, на котором есть Telegram, — код придёт туда.',
            'PHONE_NOT_ON_TELEGRAM',
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }
}
