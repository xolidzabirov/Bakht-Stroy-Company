<?php

declare(strict_types=1);

namespace App\Modules\Order\Support;

use App\Modules\Order\Enums\DeliveryType;

/**
 * Delivery cost in sums: pickup is free, delivery is free from a subtotal threshold.
 */
final class DeliveryPrice
{
    public static function for(DeliveryType $type, int $subtotal): int
    {
        if ($type === DeliveryType::Pickup) {
            return 0;
        }

        $freeFrom = (int) config('shop.delivery.free_from');

        if ($freeFrom > 0 && $subtotal >= $freeFrom) {
            return 0;
        }

        return (int) config('shop.delivery.price');
    }
}
