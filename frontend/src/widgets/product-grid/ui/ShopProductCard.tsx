import { ProductCard } from "@/entities/product/ui/ProductCard";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";
import { FavoriteButton } from "@/features/toggle-favorite/ui/FavoriteButton";
import type { Product } from "@/shared/api/types";

/**
 * Product card of the shop: the entity card with the heart and the "В корзину" button.
 */
export function ShopProductCard({ product }: { product: Product }) {
  return <ProductCard product={product} favorite={<FavoriteButton productId={product.id} />} action={<AddToCartButton product={product} />} />;
}
