import Link from "next/link";
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
export function FiltersForm({ action, search, sort, priceFrom, priceTo, inStock, featured }: Props) {
  return (
    <form action={action} className="space-y-6">
      {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}

      <div>
        <label htmlFor="filter-search" className="text-sm font-semibold">
          Поиск
        </label>
        <input id="filter-search" name="search" type="search" defaultValue={search} placeholder="Цемент, кирпич…" className={`${input} mt-2`} />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Цена, сомони</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input name="price_from" type="number" min={0} step="any" inputMode="decimal" defaultValue={priceFrom} placeholder="от" aria-label="Цена от" className={input} />
          <input name="price_to" type="number" min={0} step="any" inputMode="decimal" defaultValue={priceTo} placeholder="до" aria-label="Цена до" className={input} />
        </div>
      </fieldset>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" name="in_stock" value="1" defaultChecked={inStock} className="size-5 rounded accent-brand" />
          Только в наличии
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" name="featured" value="1" defaultChecked={featured} className="size-5 rounded accent-brand" />
          Хиты продаж
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Показать
        </Button>
        <Link href={action} className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-muted hover:text-foreground">
          Сбросить
        </Link>
      </div>
    </form>
  );
}
