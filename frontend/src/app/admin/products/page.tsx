import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Pencil, Plus } from "lucide-react";
import { flattenCategories } from "@/features/admin-products/lib/categories";
import { DeleteProduct, ProductFlag, StockEditor } from "@/features/admin-products/ui/ProductRowActions";
import { ResetFilters, SearchFilter, SelectFilter } from "@/features/admin-filters/ui/Filters";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminProduct, Category, Paginated } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
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
  const query = new URLSearchParams({ per_page: "20", sort: search.sort ?? "new" });
  (["search", "category", "is_active", "page"] as const).forEach((key) => search[key] && query.set(key, search[key]!));

  const [{ t, locale }, products, { data: tree }] = await Promise.all([
    getI18n(),
    userFetch<Paginated<AdminProduct>>(`/admin/products?${query}`),
    userFetch<{ data: Category[] }>("/admin/categories"),
  ]);
  const p = t.admin.products;
  const units = t.admin.product.units;
  const categories = flattenCategories(tree);
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
        <SelectFilter name="category" label={p.category} allLabel={p.allCategories} options={categories.map((c) => ({ value: c.slug, label: c.label }))} />
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

      {products.data.length === 0 ? (
        <EmptyState icon={Boxes} title={t.admin.common.empty} text={t.admin.common.emptyText} action={addButton} />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            <li className="hidden grid-cols-[1fr_8rem_11rem_4.5rem_4.5rem_5.5rem] gap-3 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
              <span>{p.product}</span>
              <span className="text-right">{p.price}</span>
              <span>{p.stock}</span>
              <span>{p.status}</span>
              <span>{p.featured}</span>
              <span />
            </li>
            {products.data.map((product) => (
              <li key={product.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 lg:grid-cols-[1fr_8rem_11rem_4.5rem_4.5rem_5.5rem]">
                <Link href={routes.adminProduct(product.id)} className="flex min-w-0 items-center gap-3">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image.thumb} alt="" className="size-12 shrink-0 rounded-xl bg-muted object-cover" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted">
                      <Boxes className="size-5 text-muted-foreground" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <b className={`line-clamp-2 text-sm leading-snug hover:underline ${product.is_active ? "" : "text-muted-foreground"}`}>{product.name}</b>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[product.sku, product.category?.name].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>

                <span className="text-right text-sm lg:block">
                  <b className="tabular-nums">{formatMoney(product.price, locale)}</b>
                  {product.old_price && <s className="block text-xs text-muted-foreground">{formatMoney(product.old_price, locale)}</s>}
                </span>

                <span className="col-span-2 flex flex-wrap items-center justify-between gap-3 lg:col-span-1 lg:contents">
                  <StockEditor productId={product.id} stock={product.stock} unit={units[product.unit.value] ?? product.unit.label} low={product.is_low_stock} />
                  <span className="flex items-center gap-2 lg:block">
                    <span className="text-xs text-muted-foreground lg:hidden">{p.status}</span>
                    <ProductFlag productId={product.id} field="is_active" value={product.is_active} label={p.status} />
                  </span>
                  <span className="flex items-center gap-2 lg:block">
                    <span className="text-xs text-muted-foreground lg:hidden">{p.featured}</span>
                    <ProductFlag productId={product.id} field="is_featured" value={product.is_featured} label={p.featured} />
                  </span>
                  <span className="flex justify-end gap-1">
                    <Link href={routes.adminProduct(product.id)} aria-label={t.admin.common.edit} title={t.admin.common.edit} className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
                      <Pencil className="size-4" />
                    </Link>
                    <DeleteProduct productId={product.id} name={product.name} />
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Pagination page={products.meta.current_page} lastPage={products.meta.last_page} href={pageHref} />
        </>
      )}
    </div>
  );
}
