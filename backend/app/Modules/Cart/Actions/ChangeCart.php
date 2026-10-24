<?php

declare(strict_types=1);

namespace App\Modules\Cart\Actions;

use App\Modules\Cart\Exceptions\BelowMinOrderException;
use App\Modules\Cart\Exceptions\NotEnoughStockException;
use App\Modules\Cart\Exceptions\ProductUnavailableException;
use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;

/**
 * All cart changes: add, set quantity, remove, clear.
 */
final class ChangeCart
{
    /**
     * Adds the quantity to what is already in the cart.
     */
    public function add(User $user, int $productId, int $quantity): CartItem
    {
        $product = Product::query()->visible()->with('category')->find($productId);

        if ($product === null) {
            throw new ProductUnavailableException;
        }

        $item = CartItem::query()->firstOrNew(['user_id' => $user->id, 'product_id' => $product->id]);
        $newQuantity = ($item->exists ? $item->quantity : 0) + $quantity;

        $this->ensureCanOrder($product, $newQuantity);

        $item->quantity = $newQuantity;
        $item->save();

        return $item;
    }

    /**
     * Sets an exact quantity for a cart line.
     */
    public function setQuantity(CartItem $item, int $quantity): CartItem
    {
        $product = $item->product;

        if ($product === null || $product->trashed() || ! $product->isVisible()) {
            throw new ProductUnavailableException;
        }

        $this->ensureCanOrder($product, $quantity);

        $item->update(['quantity' => $quantity]);

        return $item;
    }

    public function remove(CartItem $item): void
    {
        $item->delete();
    }

    public function clear(User $user): void
    {
        CartItem::query()->where('user_id', $user->id)->delete();
    }

    public function ensureCanOrder(Product $product, int $quantity): void
    {
        if ($quantity < $product->min_order_qty) {
            throw new BelowMinOrderException($product->min_order_qty, $product->unit->label());
        }

        if ($quantity > $product->stock) {
            throw new NotEnoughStockException($product->stock, $product->unit->label());
        }
    }
}
