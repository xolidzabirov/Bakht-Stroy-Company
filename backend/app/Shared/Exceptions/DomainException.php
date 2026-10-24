<?php

declare(strict_types=1);

namespace App\Shared\Exceptions;

use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Business rule violation that should reach the API client as-is.
 *
 * Example: throw new DomainException('Товар закончился', 'OUT_OF_STOCK', Response::HTTP_CONFLICT);
 */
class DomainException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $errorCode = 'DOMAIN_ERROR',
        public readonly int $status = Response::HTTP_UNPROCESSABLE_ENTITY,
    ) {
        parent::__construct($message);
    }
}
