<?php

use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Support\DeliveryPrice;

it('calculates the delivery price', function (DeliveryType $type, int $subtotal, int $expected) {
    config(['shop.delivery.price' => 50000, 'shop.delivery.free_from' => 3000000]);

    expect(DeliveryPrice::for($type, $subtotal))->toBe($expected);
})->with([
    'paid delivery' => [DeliveryType::Delivery, 100000, 50000],
    'free from threshold' => [DeliveryType::Delivery, 3000000, 0],
    'pickup' => [DeliveryType::Pickup, 100000, 0],
]);
