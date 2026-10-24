<?php

declare(strict_types=1);

namespace App\Modules\Order\Actions;

use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Exceptions\OrderCannotBeCancelledException;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;

final class CancelOrderByClient
{
    public function __construct(private ChangeOrderStatus $changeStatus) {}

    public function handle(Order $order, User $client, ?string $reason): Order
    {
        if (! $order->status->canBeCancelledByClient()) {
            throw new OrderCannotBeCancelledException;
        }

        return $this->changeStatus->handle(
            $order,
            OrderStatus::Cancelled,
            $client,
            $reason ? 'Отменён покупателем: '.$reason : 'Отменён покупателем',
            byClient: true,
        );
    }
}
