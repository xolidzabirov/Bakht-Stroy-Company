<?php

declare(strict_types=1);

namespace App\Modules\Order\Enums;

/**
 * The order is paid before delivery: cash at the office or a transfer to the company card.
 * The manager confirms the money arrived and marks the order as paid.
 */
enum PaymentMethod: string
{
    case Cash = 'cash';
    case CardTransfer = 'card_transfer';
    case Transfer = 'transfer';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Наличными в офисе',
            self::CardTransfer => 'Переводом на карту (Корти Милли, Visa)',
            self::Transfer => 'Безналичный расчёт (для юрлиц)',
        };
    }
}
