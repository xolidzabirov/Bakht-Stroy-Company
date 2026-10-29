import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { getCategories } from "@/entities/category/api/getCategories";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import { getProducts } from "@/entities/product/api/getProducts";
import { ShopProductCard } from "@/widgets/product-grid/ui/ShopProductCard";
import { type CatalogSearchParams, catalogHref, hasActiveFilters, parseCatalogParams } from "@/features/product-filters/model/params";
import { FiltersForm } from "@/features/product-filters/ui/FiltersForm";
import { SortSelect } from "@/features/product-filters/ui/SortSelect";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt, plural } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { ButtonLink, Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { Pagination } from "@/shared/ui/Pagination";

type Props = {
  /** Current category; none — the whole catalog. */
  category?: Category;
  params: CatalogSearchParams;
};

/**
 * Catalog page body: categories and filters on the left, sorting, product grid and pages on the right.
 */
export async function CatalogListing({ category, params }: Props) {
  const base = category ? routes.category(category.slug) : routes.catalog;
  const { filters, priceFrom, priceTo, page, sort } = parseCatalogParams(params);

  const [categories, result, { t, locale }] = await Promise.all([getCategories(), getProducts({ ...filters, category: category?.slug }), getI18n()]);

  const products = result?.data ?? [];
  const total = result?.meta.total ?? 0;
  const title = filters.search && !category ? fmt(t.catalog.searchTitle, { query: filters.search }) : (category?.name ?? t.catalog.title);

  const filtersForm = (
    <FiltersForm
      action={base}
      search={filters.search}
      sort={sort}
      priceFrom={priceFrom}
      priceTo={priceTo}
      inStock={Boolean(filters.in_stock)}
      featured={Boolean(filters.featured)}
    />
  );

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[{ label: t.nav.home, href: routes.home }, category ? { label: t.nav.catalog, href: routes.catalog } : { label: t.nav.catalog }, ...(category ? [{ label: category.name }] : [])]}
      />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {category && <CategoryIcon slug={category.slug} size="md" />}
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result ? `${total} ${plural(locale, total, t.common.products)}` : t.catalog.unavailable}
              {category?.description && <span className="hidden md:inline"> · {category.description}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] [&>*]:min-w-0">
        <aside className="space-y-6">
          <nav aria-label={t.catalog.categories} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0">
            <Link
              href={catalogHref(routes.catalog, params, {})}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition lg:border-transparent",
                !category ? "border-ink bg-ink text-white dark:bg-white dark:text-ink" : "border-border hover:bg-surface-muted",
              )}
            >
              {t.catalog.allProducts}
            </Link>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={catalogHref(routes.category(item.slug), params, {})}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition lg:border-transparent",
                  item.slug === category?.slug ? "border-ink bg-ink text-white dark:bg-white dark:text-ink" : "border-border hover:bg-surface-muted",
                )}
              >
                <CategoryIcon slug={item.slug} size="sm" className="hidden ring-offset-0 lg:grid" />
                <span className="flex-1 whitespace-nowrap lg:whitespace-normal">{item.name}</span>
                {typeof item.products_count === "number" && <span className="hidden text-xs opacity-60 lg:inline">{item.products_count}</span>}
              </Link>
            ))}
          </nav>

          <div className="hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 lg:block">{filtersForm}</div>

          <details className="rounded-[var(--radius-card)] border border-border bg-surface lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold">
              <SlidersHorizontal className="size-4" />
              {t.catalog.filters}
              {hasActiveFilters(params) && <span className="size-2 rounded-full bg-brand" />}
            </summary>
            <div className="border-t border-border p-4">{filtersForm}</div>
          </details>
        </aside>

        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{result && total > 0 && fmt(t.catalog.shown, { shown: products.length, total })}</p>
            <Suspense>
              <SortSelect value={sort} />
            </Suspense>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {products.map((product, index) => (
                <ShopProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="grid place-items-center rounded-[var(--radius-card)] border border-dashed border-border px-6 py-16 text-center">
              <PackageSearch className="size-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-bold">{t.catalog.emptyTitle}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {t.catalog.emptyText}
              </p>
              {hasActiveFilters(params) && (
                <ButtonLink href={base} variant="outline" className="mt-5">
                  {t.catalog.resetFilters}
                </ButtonLink>
              )}
            </div>
          )}

          {result && <Pagination page={page} lastPage={result.meta.last_page} href={(value) => catalogHref(base, params, { page: value })} />}
        </section>
      </div>
    </Container>
  );
}
