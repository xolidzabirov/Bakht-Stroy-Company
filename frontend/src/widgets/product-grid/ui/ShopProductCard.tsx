import { Suspense } from "react";
import { ProductCard } from "@/entities/product/ui/ProductCard";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";
import { FavoriteButton } from "@/features/toggle-favorite/ui/FavoriteButton";
import type { Product } from "@/shared/api/types";

/**
 * Product card of the shop: the entity card with the heart and the "В корзину" button.
 * A boundary per card: the browser brings the cards to life one by one, in short tasks, instead of all in one long one.
 * The button gets only what it needs: everything passed here travels inside the page.
 */
export function ShopProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { id, min_order_qty, stock, in_stock } = product;

  return (
    <Suspense>
      <ProductCard product={product} priority={priority} favorite={<FavoriteButton productId={id} />} action={<AddToCartButton product={{ id, min_order_qty, stock, in_stock }} />} />
    </Suspense>
  );
}
