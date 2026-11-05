import { apiTry, SHOP_CACHE_SECONDS } from "@/shared/api/http";
import type { Product, ProductDetails, ReviewsPage } from "@/shared/api/types";

/**
 * Product page data; null when the product does not exist (or the API is down).
 */
export async function getProduct(slug: string): Promise<ProductDetails | null> {
  const response = await apiTry<{ data: ProductDetails }>(`/products/${encodeURIComponent(slug)}`, { revalidate: SHOP_CACHE_SECONDS });

  return response?.data ?? null;
}

/**
 * "Похожие товары" — from the same category.
 */
export async function getRelatedProducts(slug: string): Promise<Product[]> {
  const response = await apiTry<{ data: Product[] }>(`/products/${encodeURIComponent(slug)}/related`, { revalidate: SHOP_CACHE_SECONDS });

  return response?.data ?? [];
}

/**
 * First page of the reviews, inside the page for visitors and search engines; null when the API is down.
 */
export async function getProductReviews(slug: string): Promise<ReviewsPage | null> {
  return apiTry<ReviewsPage>(`/products/${encodeURIComponent(slug)}/reviews`, { revalidate: SHOP_CACHE_SECONDS });
}
