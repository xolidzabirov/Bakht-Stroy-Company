<?php

declare(strict_types=1);

namespace App\Modules\Auth\Exceptions;

use App\Shared\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

final class CodeRecentlySentException extends DomainException
{
    public function __construct(int $seconds = 60)
    {
        parent::__construct(
            "Код уже отправлен. Новый код можно запросить через {$seconds} сек.",
            'CODE_RECENTLY_SENT',
            Response::HTTP_TOO_MANY_REQUESTS,
        );
    }
}
