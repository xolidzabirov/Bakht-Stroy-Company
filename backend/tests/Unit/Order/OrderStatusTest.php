<?php

use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\OrderStatus;

it('allows only forward transitions and cancellation of active orders', function () {
    expect(OrderStatus::New->canTransitionTo(OrderStatus::Confirmed))->toBeTrue()
        ->and(OrderStatus::New->canTransitionTo(OrderStatus::Completed))->toBeFalse()
        ->and(OrderStatus::Delivering->canTransitionTo(OrderStatus::Cancelled))->toBeTrue()
        ->and(OrderStatus::Completed->isFinal())->toBeTrue()
        ->and(OrderStatus::Cancelled->nextStatuses())->toBe([])
        ->and(OrderStatus::New->canBeCancelledByClient())->toBeTrue()
        ->and(OrderStatus::Confirmed->canBeCancelledByClient())->toBeFalse();
});

it('offers one next step after assembly: on the way for a delivery, completed for a pickup', function () {
    expect(OrderStatus::Assembling->nextStatusesFor(DeliveryType::Delivery))->toBe([OrderStatus::Delivering, OrderStatus::Cancelled])
        ->and(OrderStatus::Assembling->nextStatusesFor(DeliveryType::Pickup))->toBe([OrderStatus::Completed, OrderStatus::Cancelled])
        ->and(OrderStatus::Assembling->canTransitionTo(OrderStatus::Completed, DeliveryType::Delivery))->toBeFalse()
        ->and(OrderStatus::Assembling->canTransitionTo(OrderStatus::Delivering, DeliveryType::Pickup))->toBeFalse()
        ->and(OrderStatus::Delivering->nextStatusesFor(DeliveryType::Delivery))->toBe([OrderStatus::Completed, OrderStatus::Cancelled]);
});
