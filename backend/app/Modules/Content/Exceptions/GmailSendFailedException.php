<?php

declare(strict_types=1);

namespace App\Modules\Content\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class GmailSendFailedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Письмо не отправилось. Проверьте подключение Gmail и попробуйте ещё раз.', 'GMAIL_SEND_FAILED', Response::HTTP_SERVICE_UNAVAILABLE);
    }
}
