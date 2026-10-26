<?php

declare(strict_types=1);

namespace App\Modules\Order\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case CardOnDelivery = 'card_on_delivery';
    case CardTransfer = 'card_transfer';
    case Transfer = 'transfer';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Наличными при получении',
            self::CardOnDelivery => 'Картой при получении',
            self::CardTransfer => 'Переводом на карту (Корти Милли, Visa)',
            self::Transfer => 'Безналичный расчёт (для юрлиц)',
        };
    }
}
