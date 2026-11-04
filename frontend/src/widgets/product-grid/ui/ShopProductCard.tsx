import { Suspense } from "react";
import { ProductCard } from "@/entities/product/ui/ProductCard";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";
import { QuickOrderButton } from "@/features/quick-order/ui/QuickOrderButton";
import { FavoriteButton } from "@/features/toggle-favorite/ui/FavoriteButton";
import type { Product } from "@/shared/api/types";

/**
 * Product card of the shop: the entity card with the heart, "В корзину" and "Беру сразу".
 * A boundary per card: the browser brings the cards to life one by one, in short tasks, instead of all in one long one.
 * The button gets only what it needs: everything passed here travels inside the page.
 */
export function ShopProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { id, name, price, min_order_qty, stock, in_stock } = product;
  const quick = { id, name, price, unit: product.unit.label, image: product.image?.thumb, min_order_qty, stock, in_stock };

  return (
    <Suspense>
      <ProductCard
        product={product}
        priority={priority}
        favorite={<FavoriteButton productId={id} />}
        action={
          <div className="@container">
            <div className="flex flex-col gap-2 @[15rem]:flex-row">
              <AddToCartButton product={{ id, min_order_qty, stock, in_stock }} className="min-w-0 @[15rem]:flex-1" />
              <QuickOrderButton product={quick} />
            </div>
          </div>
        }
      />
    </Suspense>
  );
}
