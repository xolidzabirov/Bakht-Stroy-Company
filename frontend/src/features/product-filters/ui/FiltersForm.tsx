import { getI18n } from "@/shared/i18n/server";
import { Button } from "@/shared/ui";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { AutoFilterForm } from "./AutoFilterForm";

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
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/30";

/**
 * The fields are rendered here and apply by themselves (AutoFilterForm). The state lives in the URL, so a filtered page can be shared.
 * Without JavaScript it is a plain GET form with a button of its own.
 */
export async function FiltersForm({ action, search, sort, priceFrom, priceTo, inStock, featured }: Props) {
  const { t } = await getI18n();

  return (
    <AutoFilterForm action={action} resetLabel={t.catalog.reset} className="space-y-6">
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
          <Checkbox name="in_stock" value="1" defaultChecked={inStock} />
          {t.catalog.onlyInStock}
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <Checkbox name="featured" value="1" defaultChecked={featured} />
          {t.catalog.hits}
        </label>
      </div>

      <noscript>
        <Button type="submit" className="w-full">
          {t.catalog.show}
        </Button>
      </noscript>
    </AutoFilterForm>
  );
}
