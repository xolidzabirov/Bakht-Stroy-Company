<?php

declare(strict_types=1);

namespace App\Modules\Order\Actions;

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Order\DTO\PlaceOrderData;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Enums\PaymentStatus;
use App\Modules\Order\Events\OrderPlaced;
use App\Modules\Order\Exceptions\CartEmptyException;
use App\Modules\Order\Exceptions\CartHasProblemsException;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Support\DeliveryPrice;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Turns the cart into an order in one transaction:
 * locks products, checks stock, copies prices and names, writes off stock, clears the cart.
 */
final class PlaceOrder
{
    public function handle(User $user, PlaceOrderData $data): Order
    {
        $order = DB::transaction(function () use ($user, $data): Order {
            $items = CartItem::query()->where('user_id', $user->id)->orderBy('id')->get();

            if ($items->isEmpty()) {
                throw new CartEmptyException;
            }

            $products = $this->lockProducts($items);
            $this->ensureOrderable($items, $products);

            $subtotal = $items->sum(fn (CartItem $item) => $products[$item->product_id]->price * $item->quantity);
            $deliveryPrice = DeliveryPrice::for($data->deliveryType, $subtotal);

            $order = Order::query()->create([
                'user_id' => $user->id,
                'status' => OrderStatus::New,
                'payment_method' => $data->paymentMethod,
                'payment_status' => PaymentStatus::Pending,
                'delivery_type' => $data->deliveryType,
                'address' => $data->address,
                'customer_name' => $data->customerName,
                'customer_phone' => $data->customerPhone,
                'customer_email' => $user->email,
                'subtotal' => $subtotal,
                'delivery_price' => $deliveryPrice,
                'discount' => 0,
                'total' => $subtotal + $deliveryPrice,
                'comment' => $data->comment,
            ]);

            $order->forceFill(['number' => Order::formatNumber($order->id)])->save();

            foreach ($items as $item) {
                $product = $products[$item->product_id];

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'unit' => $product->unit,
                    'price' => $product->price,
                    'quantity' => $item->quantity,
                    'total' => $product->price * $item->quantity,
                ]);

                Product::withTrashed()->whereKey($product->id)->toBase()->decrement('stock', $item->quantity);
            }

            $order->history()->create(['status' => OrderStatus::New, 'changed_by' => $user->id]);

            CartItem::query()->where('user_id', $user->id)->delete();

            return $order;
        });

        OrderPlaced::dispatch($order);

        return $order;
    }

    /**
     * SELECT ... FOR UPDATE in id order, so two orders for the last bag cannot both succeed.
     *
     * @param  Collection<int, CartItem>  $items
     * @return array<int, Product>
     */
    private function lockProducts(Collection $items): array
    {
        return Product::withTrashed()
            ->with('category')
            ->whereIn('id', $items->pluck('product_id'))
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id')
            ->all();
    }

    /**
     * @param  Collection<int, CartItem>  $items
     * @param  array<int, Product>  $products
     */
    private function ensureOrderable(Collection $items, array $products): void
    {
        $problems = [];

        foreach ($items as $item) {
            $item->setRelation('product', $products[$item->product_id] ?? null);

            if ($problem = $item->problem()) {
                $problems[] = [
                    'cart_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? null,
                    'problem' => $problem,
                    'available' => $item->product->stock ?? 0,
                    'min_order_qty' => $item->product->min_order_qty ?? 1,
                ];
            }
        }

        if ($problems !== []) {
            throw new CartHasProblemsException($problems);
        }
    }
}
