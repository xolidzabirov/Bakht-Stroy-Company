<?php

declare(strict_types=1);

namespace App\Modules\Auth\DTO;

final readonly class RegisterData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        /** Pass from the email code step (RegistrationTicket). */
        public string $registrationToken,
        public string $phone,
        public string $password,
        public string $deviceName,
    ) {}

    public function name(): string
    {
        return trim($this->firstName.' '.$this->lastName);
    }
}
