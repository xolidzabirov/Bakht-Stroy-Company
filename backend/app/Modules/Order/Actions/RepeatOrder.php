<?php

declare(strict_types=1);

namespace App\Modules\Order\Actions;

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Puts the products of an old order back into the cart, as much as is in stock.
 */
final class RepeatOrder
{
    /**
     * @return list<array{product_name: string, reason: string}> lines that could not be added
     */
    public function handle(Order $order, User $user): array
    {
        $skipped = [];

        DB::transaction(function () use ($order, $user, &$skipped): void {
            $products = Product::query()->visible()
                ->whereIn('id', $order->items->pluck('product_id')->filter())
                ->get()
                ->keyBy('id');

            foreach ($order->items as $item) {
                $product = $item->product_id !== null ? $products->get($item->product_id) : null;

                if ($product === null || ! $product->inStock()) {
                    $skipped[] = ['product_name' => $item->product_name, 'reason' => $product === null ? 'unavailable' : 'out_of_stock'];

                    continue;
                }

                $line = CartItem::query()->firstOrNew(['user_id' => $user->id, 'product_id' => $product->id]);
                $wanted = ($line->exists ? $line->quantity : 0) + $item->quantity;
                $quantity = min($wanted, $product->stock);

                if ($quantity < $wanted) {
                    $skipped[] = ['product_name' => $item->product_name, 'reason' => 'partially_added'];
                }

                $line->quantity = max($quantity, $product->min_order_qty);
                $line->save();
            }
        });

        return $skipped;
    }
}
