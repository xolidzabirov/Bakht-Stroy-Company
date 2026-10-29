import { ProductCard } from "@/entities/product/ui/ProductCard";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";
import { FavoriteButton } from "@/features/toggle-favorite/ui/FavoriteButton";
import type { Product } from "@/shared/api/types";

/**
 * Product card of the shop: the entity card with the heart and the "В корзину" button.
 */
export function ShopProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return <ProductCard product={product} priority={priority} favorite={<FavoriteButton productId={product.id} />} action={<AddToCartButton product={product} />} />;
}
