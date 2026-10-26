import { apiTry } from "@/shared/api/http";
import type { Product, ProductDetails } from "@/shared/api/types";

/**
 * Product page data; null when the product does not exist (or the API is down).
 */
export async function getProduct(slug: string): Promise<ProductDetails | null> {
  const response = await apiTry<{ data: ProductDetails }>(`/products/${encodeURIComponent(slug)}`, { revalidate: 60 });

  return response?.data ?? null;
}

/**
 * "Похожие товары" — from the same category.
 */
export async function getRelatedProducts(slug: string): Promise<Product[]> {
  const response = await apiTry<{ data: Product[] }>(`/products/${encodeURIComponent(slug)}/related`, { revalidate: 300 });

  return response?.data ?? [];
}
