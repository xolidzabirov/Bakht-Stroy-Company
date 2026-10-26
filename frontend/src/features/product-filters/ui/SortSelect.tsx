"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { sortOptions } from "../model/params";

/**
 * Sorting dropdown: changes ?sort= right away and goes back to the first page.
 */
export function SortSelect({ value }: { value: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const change = (sort: string) => {
    const query = new URLSearchParams(searchParams.toString());
    query.delete("page");

    if (sort === "popular") query.delete("sort");
    else query.set("sort", sort);

    const string = query.toString();
    startTransition(() => router.push(string ? `${pathname}?${string}` : pathname, { scroll: false }));
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">{t.catalog.sort}</span>
      <select
        value={value}
        onChange={(event) => change(event.target.value)}
        className={cn(
          "h-10 rounded-xl border border-border bg-surface px-3 font-semibold outline-none focus:border-brand",
          pending && "opacity-60",
        )}
      >
        {sortOptions.map((option) => (
          <option key={option} value={option}>
            {t.catalog.sorts[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
