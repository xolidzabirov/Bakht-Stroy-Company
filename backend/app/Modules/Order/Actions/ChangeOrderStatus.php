<?php

declare(strict_types=1);

namespace App\Modules\Order\Actions;

use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Events\OrderStatusChanged;
use App\Modules\Order\Exceptions\InvalidStatusTransitionException;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Moves an order to the next status, writes history and returns stock on cancellation.
 */
final class ChangeOrderStatus
{
    public function handle(Order $order, OrderStatus $to, ?User $by = null, ?string $comment = null, bool $byClient = false): Order
    {
        $from = DB::transaction(function () use ($order, $to, $by, $comment): OrderStatus {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $from = $order->status;

            if (! $from->canTransitionTo($to)) {
                throw new InvalidStatusTransitionException($from, $to);
            }

            $order->status = $to;
            $order->cancelled_at = $to === OrderStatus::Cancelled ? now() : $order->cancelled_at;
            $order->completed_at = $to === OrderStatus::Completed ? now() : $order->completed_at;
            $order->save();

            if ($to === OrderStatus::Cancelled) {
                $this->returnStock($order);
            }

            $order->history()->create(['status' => $to, 'comment' => $comment, 'changed_by' => $by?->id]);

            return $from;
        });

        $order->refresh();

        OrderStatusChanged::dispatch($order, $from, $to, $byClient);

        return $order;
    }

    private function returnStock(Order $order): void
    {
        $order->items()->whereNotNull('product_id')->get()->each(
            fn (OrderItem $item) => Product::withTrashed()->whereKey($item->product_id)->toBase()->increment('stock', $item->quantity),
        );
    }
}
