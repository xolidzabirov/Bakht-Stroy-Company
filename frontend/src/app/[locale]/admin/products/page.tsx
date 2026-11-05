import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Pencil, Plus, Star } from "lucide-react";
import { DeleteProduct, ProductFlag, StockEditor } from "@/features/admin-products/ui/ProductRowActions";
import { MoreFilters, ResetFilters, SearchFilter, SelectFilter } from "@/features/admin-filters/ui/Filters";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminProduct, Category, Paginated } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { formatMoney } from "@/shared/lib/format";
import { ButtonLink } from "@/shared/ui";
import { Pagination } from "@/shared/ui/Pagination";
import { EmptyState, PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.products.title };
}

type Search = Partial<Record<"search" | "category" | "is_active" | "sort" | "page", string>>;

/** Every product, hidden ones too: search, category, visibility, sort; stock and switches edit in place. */
export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaff(routes.adminProducts);
  const search = await searchParams;
  const query = new URLSearchParams({ per_page: "24", sort: search.sort ?? "new" });
  (["search", "category", "is_active", "page"] as const).forEach((key) => search[key] && query.set(key, search[key]!));

  const [{ t, locale }, products, { data: tree }] = await Promise.all([
    getI18n(),
    userFetch<Paginated<AdminProduct>>(`/admin/products?${query}`),
    userFetch<{ data: Category[] }>("/admin/categories"),
  ]);
  const p = t.admin.products;
  const units = t.admin.product.units;
  const pageHref = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    next.delete("per_page");
    return `${routes.adminProducts}?${next}`;
  };

  const addButton = (
    <ButtonLink href={routes.adminProductNew}>
      <Plus className="size-4" />
      {p.add}
    </ButtonLink>
  );

  return (
    <div>
      <PageHeader icon={Boxes} title={p.title} description={fmt(t.admin.common.total, { count: String(products.meta.total) })} actions={addButton} />

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchFilter placeholder={p.searchPlaceholder} />
        <MoreFilters names={["is_active", "sort", "category"]}>
        <SelectFilter
          name="is_active"
          label={p.visibility}
          options={[
            { value: "1", label: p.onlyActive },
            { value: "0", label: p.onlyHidden },
          ]}
        />
        <SelectFilter name="sort" label={p.sort} allLabel={p.sorts.new} options={Object.entries(p.sorts).filter(([value]) => value !== "new").map(([value, label]) => ({ value, label }))} />
        <ResetFilters />

      {/* Products split by category: one tap shows a category, the counts come with the tree. */}
      <nav aria-label={p.category} className="flex w-full flex-wrap gap-2 md:mt-1">
        {[{ slug: "", name: p.allCategories, count: undefined as number | undefined }, ...tree.map((c) => ({ slug: c.slug, name: c.name, count: c.products_count ?? undefined }))].map((c) => {
          const active = (search.category ?? "") === c.slug;
          const next = new URLSearchParams(query);
          next.delete("page");
          next.delete("per_page");
          if (c.slug) next.set("category", c.slug);
          else next.delete("category");
          return (
            <Link
              key={c.slug || "all"}
              href={`${routes.adminProducts}?${next}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition",
                active ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink" : "border-border bg-surface hover:border-foreground/40",
              )}
            >
              {c.name}
              {typeof c.count === "number" && <span className={cn("text-xs", active ? "opacity-70" : "text-muted-foreground")}>{c.count}</span>}
            </Link>
          );
        })}
      </nav>
        </MoreFilters>
      </div>

      {products.data.length === 0 ? (
        <EmptyState icon={Boxes} title={t.admin.common.empty} text={t.admin.common.emptyText} action={addButton} />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.data.map((product, index) => (
              <li
                key={product.id}
                style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
                className="group flex animate-in flex-col overflow-hidden rounded-2xl border border-border bg-surface fade-in-0 slide-in-from-bottom-2 card-hover fill-mode-both"
              >
                <Link href={routes.adminProduct(product.id)} tabIndex={-1} aria-hidden className="relative block aspect-[4/3] overflow-hidden bg-muted">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image.card} alt="" loading="lazy" className={cn("size-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]", !product.is_active && "opacity-50 grayscale")} />
                  ) : (
                    <span className="grid size-full place-items-center">
                      <Boxes className="size-8 text-muted-foreground" />
                    </span>
                  )}
                  <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                    {!product.is_active && <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">{p.onlyHidden}</span>}
                    {product.is_featured && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-ink">{p.featured}</span>}
                    {product.old_price && <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">%</span>}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-md transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    <Pencil className="size-3.5" />
                    {t.admin.common.edit}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-4 pb-3">
                  <Link href={routes.adminProduct(product.id)} className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug hover:underline">
                    {product.name}
                  </Link>
                  <p className="mt-1 flex min-w-0 gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 tabular-nums">{product.sku}</span>
                    <span className="truncate">{product.category?.name}</span>
                  </p>
                  <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
                    <b className="text-lg font-bold tabular-nums">{formatMoney(product.price, locale)}</b>
                    {product.old_price && <s className="text-xs text-muted-foreground">{formatMoney(product.old_price, locale)}</s>}
                      {product.reviews_count > 0 && product.rating ? (
                        <a href={`${routes.adminProduct(product.id)}#reviews`} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold tabular-nums hover:underline">
                          <Star className="size-3.5 fill-brand text-brand" />
                          {product.rating.toFixed(1)}
                          <span className="font-normal text-muted-foreground">({product.reviews_count})</span>
                        </a>
                      ) : null}
                  </div>

                  <div className="mt-1.5">
                    <StockEditor productId={product.id} stock={product.stock} unit={units[product.unit.value] ?? product.unit.label} low={product.is_low_stock} />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-3">
                    <ProductFlag productId={product.id} field="is_active" value={product.is_active} label={p.visibleOn} offLabel={p.visibleOff} hint={p.visibleHint} />
                    <ProductFlag productId={product.id} field="is_featured" value={product.is_featured} label={p.featured} offLabel={p.featured} hint={p.featuredHint} />
                    <span className="ml-auto">
                      <DeleteProduct productId={product.id} name={product.name} />
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pagination page={products.meta.current_page} lastPage={products.meta.last_page} href={pageHref} />
        </>
      )}
    </div>
  );
}
