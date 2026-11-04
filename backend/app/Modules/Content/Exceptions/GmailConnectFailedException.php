<?php

declare(strict_types=1);

namespace App\Modules\Content\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class GmailConnectFailedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Не удалось подключить Gmail: разрешите отправку писем на странице Google и попробуйте ещё раз.', 'GMAIL_CONNECT_FAILED', Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
