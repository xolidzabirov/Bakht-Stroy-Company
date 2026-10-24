<?php

use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Support\DeliveryPrice;
use Tests\TestCase;

uses(TestCase::class);

it('allows only forward transitions and cancellation of active orders', function () {
    expect(OrderStatus::New->canTransitionTo(OrderStatus::Confirmed))->toBeTrue()
        ->and(OrderStatus::New->canTransitionTo(OrderStatus::Completed))->toBeFalse()
        ->and(OrderStatus::Delivering->canTransitionTo(OrderStatus::Cancelled))->toBeTrue()
        ->and(OrderStatus::Completed->isFinal())->toBeTrue()
        ->and(OrderStatus::Cancelled->nextStatuses())->toBe([])
        ->and(OrderStatus::New->canBeCancelledByClient())->toBeTrue()
        ->and(OrderStatus::Confirmed->canBeCancelledByClient())->toBeFalse();
});

it('calculates the delivery price', function (DeliveryType $type, int $subtotal, int $expected) {
    config(['shop.delivery.price' => 50000, 'shop.delivery.free_from' => 3000000]);

    expect(DeliveryPrice::for($type, $subtotal))->toBe($expected);
})->with([
    'paid delivery' => [DeliveryType::Delivery, 100000, 50000],
    'free from threshold' => [DeliveryType::Delivery, 3000000, 0],
    'pickup' => [DeliveryType::Pickup, 100000, 0],
]);
