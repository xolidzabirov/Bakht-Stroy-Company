<?php

declare(strict_types=1);

namespace App\Modules\Auth\DTO;

use App\Modules\User\Enums\CustomerType;

final readonly class RegisterData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public CustomerType $customerType,
        /** Pass from the phone step (RegistrationTicket). */
        public string $registrationToken,
        public string $email,
        public string $password,
        public string $deviceName,
    ) {}

    public function name(): string
    {
        return trim($this->firstName.' '.$this->lastName);
    }
}
