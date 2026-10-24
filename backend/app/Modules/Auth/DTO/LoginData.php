<?php

declare(strict_types=1);

namespace App\Modules\Auth\DTO;

final readonly class LoginData
{
    public function __construct(
        /** Normalized phone (E.164) or lowercase email. */
        public string $login,
        public string $password,
        public string $deviceName,
    ) {}
}
