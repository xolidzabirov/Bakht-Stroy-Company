import { apiTry } from "@/shared/api/http";
import type { Paginated, Product } from "@/shared/api/types";

export type ProductFilters = {
  category?: string;
  search?: string;
  sort?: "popular" | "new" | "price" | "-price" | "name";
  featured?: boolean;
  in_stock?: boolean;
  price_min?: number;
  price_max?: number;
  page?: number;
  per_page?: number;
};

function toQuery(filters: ProductFilters): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== false) {
      params.set(key, value === true ? "1" : String(value));
    }
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

/**
 * Catalog list. Cached for a minute — prices and stock change often.
 */
export async function getProducts(filters: ProductFilters = {}): Promise<Paginated<Product> | null> {
  return apiTry<Paginated<Product>>(`/products${toQuery(filters)}`, { revalidate: 60 });
}
