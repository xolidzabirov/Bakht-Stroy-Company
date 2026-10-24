<?php

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
