import Link from "next/link";
import { getI18n } from "@/shared/i18n/server";
import { Button } from "@/shared/ui";

type Props = {
  /** Page the form submits to: /catalog or /catalog/{slug}. */
  action: string;
  search?: string;
  sort: string;
  priceFrom?: number;
  priceTo?: number;
  inStock: boolean;
  featured: boolean;
};

const input =
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/30";

/**
 * Plain GET form — works without JavaScript; the state lives in the URL, so a filtered page can be shared.
 */
export async function FiltersForm({ action, search, sort, priceFrom, priceTo, inStock, featured }: Props) {
  const { t } = await getI18n();

  return (
    <form action={action} className="space-y-6">
      {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}

      <div>
        <label htmlFor="filter-search" className="text-sm font-semibold">
          {t.catalog.search}
        </label>
        <input id="filter-search" name="search" type="search" defaultValue={search} placeholder={t.catalog.searchPlaceholder} className={`${input} mt-2`} />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">{t.catalog.price}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input name="price_from" type="number" min={0} step="any" inputMode="decimal" defaultValue={priceFrom} placeholder={t.catalog.priceFrom} aria-label={t.catalog.priceFromLabel} className={input} />
          <input name="price_to" type="number" min={0} step="any" inputMode="decimal" defaultValue={priceTo} placeholder={t.catalog.priceTo} aria-label={t.catalog.priceToLabel} className={input} />
        </div>
      </fieldset>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" name="in_stock" value="1" defaultChecked={inStock} className="size-5 rounded accent-brand" />
          {t.catalog.onlyInStock}
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" name="featured" value="1" defaultChecked={featured} className="size-5 rounded accent-brand" />
          {t.catalog.hits}
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t.catalog.show}
        </Button>
        <Link href={action} className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-muted hover:text-foreground">
          {t.catalog.reset}
        </Link>
      </div>
    </form>
  );
}
