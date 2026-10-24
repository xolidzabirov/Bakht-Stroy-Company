<?php

declare(strict_types=1);

namespace App\Modules\Order\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case CardOnDelivery = 'card_on_delivery';
    case Transfer = 'transfer';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Наличными при получении',
            self::CardOnDelivery => 'Картой при получении',
            self::Transfer => 'Перечислением (для юрлиц)',
        };
    }
}
