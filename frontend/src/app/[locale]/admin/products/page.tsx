import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Pencil, Plus } from "lucide-react";
import { DeleteProduct, ProductFlag, StockEditor } from "@/features/admin-products/ui/ProductRowActions";
import { ResetFilters, SearchFilter, SelectFilter } from "@/features/admin-filters/ui/Filters";
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
      <PageHeader title={p.title} description={fmt(t.admin.common.total, { count: String(products.meta.total) })} actions={addButton} />

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchFilter placeholder={p.searchPlaceholder} />
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
      </div>

      {/* Products split by category: one tap shows a category, the counts come with the tree. */}
      <nav aria-label={p.category} className="no-scrollbar -mx-3 mb-4 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
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
                <Link href={routes.adminProduct(product.id)} className="relative block aspect-[4/3] overflow-hidden bg-muted">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image.card} alt="" loading="lazy" className={cn("size-full object-cover transition duration-500 group-hover:scale-105", !product.is_active && "opacity-50 grayscale")} />
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
                  <span className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-surface/90 text-foreground opacity-0 shadow transition group-hover:opacity-100">
                    <Pencil className="size-4" />
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <span className="truncate text-xs text-muted-foreground">{[product.sku, product.category?.name].filter(Boolean).join(" · ")}</span>
                  <Link href={routes.adminProduct(product.id)} className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-snug hover:underline">
                    {product.name}
                  </Link>
                  <div className="mt-2 flex items-baseline gap-2">
                    <b className="text-lg tabular-nums">{formatMoney(product.price, locale)}</b>
                    {product.old_price && <s className="text-xs text-muted-foreground">{formatMoney(product.old_price, locale)}</s>}
                  </div>

                  <div className="mt-3">
                    <StockEditor productId={product.id} stock={product.stock} unit={units[product.unit.value] ?? product.unit.label} low={product.is_low_stock} />
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <ProductFlag productId={product.id} field="is_active" value={product.is_active} label={p.status} />
                      {p.status}
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <ProductFlag productId={product.id} field="is_featured" value={product.is_featured} label={p.featured} />
                      {p.featured}
                    </label>
                    <DeleteProduct productId={product.id} name={product.name} />
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
