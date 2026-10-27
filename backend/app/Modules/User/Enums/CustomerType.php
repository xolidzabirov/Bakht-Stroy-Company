<?php

declare(strict_types=1);

namespace App\Modules\User\Enums;

/**
 * Chosen at registration: private customers and companies (builders, crews) who buy wholesale.
 */
enum CustomerType: string
{
    case Person = 'person';
    case Company = 'company';

    public function label(): string
    {
        return match ($this) {
            self::Person => 'Частное лицо',
            self::Company => 'Компания',
        };
    }
}
