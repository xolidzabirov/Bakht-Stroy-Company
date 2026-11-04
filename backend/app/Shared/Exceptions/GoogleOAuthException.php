<?php

declare(strict_types=1);

namespace App\Shared\Exceptions;

use RuntimeException;

/**
 * Google refused or did not answer. Internal: callers turn it into a message for people.
 */
final class GoogleOAuthException extends RuntimeException
{
    public function __construct(string $message, public readonly bool $accessRevoked = false)
    {
        parent::__construct($message);
    }
}
