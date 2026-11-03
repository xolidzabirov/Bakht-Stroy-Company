import { apiTry, SHOP_CACHE_SECONDS } from "@/shared/api/http";
import type { Category } from "@/shared/api/types";

/**
 * One category by slug (with parent and children); null when it does not exist.
 */
export async function getCategory(slug: string): Promise<Category | null> {
  const response = await apiTry<{ data: Category }>(`/categories/${encodeURIComponent(slug)}`, { revalidate: SHOP_CACHE_SECONDS });

  return response?.data ?? null;
}
