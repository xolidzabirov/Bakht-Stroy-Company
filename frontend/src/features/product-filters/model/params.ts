import type { ProductFilters } from "@/entities/product/api/getProducts";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

/** Sort keys of the API; their names are in the dictionary (catalog.sorts). */
export const sortOptions = ["popular", "new", "price", "-price", "name"] as const;

export type SortValue = (typeof sortOptions)[number];

export const PER_PAGE = 12;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

const somoni = (value: string | undefined): number | undefined => {
  const number = value ? Number(value.replace(",", ".")) : NaN;

  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

/**
 * URL → API filters. Prices are typed in somoni in the URL (?price_from=50), the API wants dirams.
 */
export function parseCatalogParams(params: CatalogSearchParams) {
  const sort = sortOptions.includes(first(params.sort) as SortValue) ? (first(params.sort) as SortValue) : undefined;
  const priceFrom = somoni(first(params.price_from));
  const priceTo = somoni(first(params.price_to));
  const page = Math.max(1, Number(first(params.page)) || 1);

  const filters: ProductFilters = {
    search: first(params.search),
    sort,
    in_stock: first(params.in_stock) === "1" || undefined,
    featured: first(params.featured) === "1" || undefined,
    price_min: priceFrom !== undefined ? Math.round(priceFrom * 100) : undefined,
    price_max: priceTo !== undefined && (priceFrom === undefined || priceTo >= priceFrom) ? Math.round(priceTo * 100) : undefined,
    page,
    per_page: PER_PAGE,
  };

  return { filters, priceFrom, priceTo, page, sort: sort ?? "popular" };
}

/**
 * Link to the same listing with some parameters changed (undefined removes one). Changing filters resets the page.
 */
export function catalogHref(base: string, params: CatalogSearchParams, changes: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const single = first(value);
    if (single !== undefined && key !== "page") query.set(key, single);
  }

  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) query.delete(key);
    else query.set(key, String(value));
  }

  const string = query.toString();

  return string ? `${base}?${string}` : base;
}

/** Filters that are on (for "Сбросить"). */
export function hasActiveFilters(params: CatalogSearchParams): boolean {
  return ["search", "in_stock", "featured", "price_from", "price_to"].some((key) => first(params[key]) !== undefined);
}
