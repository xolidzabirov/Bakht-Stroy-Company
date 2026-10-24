<?php

declare(strict_types=1);

namespace App\Modules\Order\Support;

use App\Modules\Order\Enums\DeliveryType;
use App\Shared\Contracts\ShopSettings;

/**
 * Delivery cost in sums: pickup is free, delivery is free from a subtotal threshold.
 * Prices come from the store settings (admin panel), with .env values as defaults.
 */
final class DeliveryPrice
{
    public static function for(DeliveryType $type, int $subtotal): int
    {
        if ($type === DeliveryType::Pickup) {
            return 0;
        }

        $delivery = app(ShopSettings::class)->get('delivery');
        $freeFrom = (int) ($delivery['free_from'] ?? 0);

        if ($freeFrom > 0 && $subtotal >= $freeFrom) {
            return 0;
        }

        return (int) ($delivery['price'] ?? 0);
    }
}
