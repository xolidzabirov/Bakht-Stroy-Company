<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Enums;

/**
 * Unit a product is sold in (price is per one unit).
 */
enum ProductUnit: string
{
    case Piece = 'piece';
    case Bag = 'bag';
    case Kilogram = 'kg';
    case Ton = 'ton';
    case Meter = 'm';
    case SquareMeter = 'm2';
    case CubicMeter = 'm3';
    case Pack = 'pack';
    case Roll = 'roll';
    case Sheet = 'sheet';

    public function label(): string
    {
        return match ($this) {
            self::Piece => 'шт',
            self::Bag => 'мешок',
            self::Kilogram => 'кг',
            self::Ton => 'т',
            self::Meter => 'м',
            self::SquareMeter => 'м²',
            self::CubicMeter => 'м³',
            self::Pack => 'упак.',
            self::Roll => 'рулон',
            self::Sheet => 'лист',
        };
    }
}
