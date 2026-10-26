import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { getCategories } from "@/entities/category/api/getCategories";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import { getProducts } from "@/entities/product/api/getProducts";
import { ProductCard } from "@/entities/product/ui/ProductCard";
import { type CatalogSearchParams, catalogHref, hasActiveFilters, parseCatalogParams } from "@/features/product-filters/model/params";
import { FiltersForm } from "@/features/product-filters/ui/FiltersForm";
import { SortSelect } from "@/features/product-filters/ui/SortSelect";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { cn } from "@/shared/lib/cn";
import { Breadcrumbs, ButtonLink, Container, Pagination } from "@/shared/ui";

type Props = {
  /** Current category; none — the whole catalog. */
  category?: Category;
  params: CatalogSearchParams;
};

const plural = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товара";
  return "товаров";
};

/**
 * Catalog page body: categories and filters on the left, sorting, product grid and pages on the right.
 */
export async function CatalogListing({ category, params }: Props) {
  const base = category ? routes.category(category.slug) : routes.catalog;
  const { filters, priceFrom, priceTo, page, sort } = parseCatalogParams(params);

  const [categories, result] = await Promise.all([getCategories(), getProducts({ ...filters, category: category?.slug })]);

  const products = result?.data ?? [];
  const total = result?.meta.total ?? 0;
  const title = filters.search && !category ? `Поиск: «${filters.search}»` : (category?.name ?? "Каталог");

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
        items={[{ label: "Главная", href: routes.home }, category ? { label: "Каталог", href: routes.catalog } : { label: "Каталог" }, ...(category ? [{ label: category.name }] : [])]}
      />

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {category && <CategoryIcon slug={category.slug} size="md" />}
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
            <p className="mt-1 text-sm text-muted">
              {result ? `${total} ${plural(total)}` : "Каталог временно недоступен"}
              {category?.description && <span className="hidden md:inline"> · {category.description}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <nav aria-label="Категории" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0">
            <Link
              href={catalogHref(routes.catalog, params, {})}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition lg:border-transparent",
                !category ? "border-ink bg-ink text-white dark:bg-white dark:text-ink" : "border-border hover:bg-surface-muted",
              )}
            >
              Все товары
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
              Фильтры
              {hasActiveFilters(params) && <span className="size-2 rounded-full bg-brand" />}
            </summary>
            <div className="border-t border-border p-4">{filtersForm}</div>
          </details>
        </aside>

        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{result && total > 0 && `Показано ${products.length} из ${total}`}</p>
            <Suspense>
              <SortSelect value={sort} />
            </Suspense>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid place-items-center rounded-[var(--radius-card)] border border-dashed border-border px-6 py-16 text-center">
              <PackageSearch className="size-12 text-muted" />
              <p className="mt-4 text-lg font-bold">Ничего не нашли</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Попробуйте изменить фильтры или позвоните нам — подберём материал под вашу задачу.
              </p>
              {hasActiveFilters(params) && (
                <ButtonLink href={base} variant="outline" className="mt-5">
                  Сбросить фильтры
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
