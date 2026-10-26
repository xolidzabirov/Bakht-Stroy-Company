"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { sortOptions } from "../model/params";

/**
 * Sorting (shadcn/ui select): changes ?sort= right away and goes back to the first page.
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
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">{t.catalog.sort}</span>
      <Select value={value} onValueChange={change}>
        <SelectTrigger className={cn("h-10 min-w-48 rounded-xl bg-surface font-semibold", pending && "opacity-60")} aria-label={t.catalog.sort}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-xl">
          {sortOptions.map((option) => (
            <SelectItem key={option} value={option} className="rounded-lg">
              {t.catalog.sorts[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
