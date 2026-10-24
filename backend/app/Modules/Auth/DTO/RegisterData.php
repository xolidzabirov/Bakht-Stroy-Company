<?php

declare(strict_types=1);

namespace App\Modules\Auth\DTO;

final readonly class RegisterData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $code,
        public ?string $phone,
        public string $password,
        public string $deviceName,
    ) {}
}
