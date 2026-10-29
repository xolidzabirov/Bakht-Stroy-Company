"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LayoutGrid, X } from "lucide-react";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { plural } from "@/shared/i18n/format";

/**
 * "Каталог" button with a mega menu: every direction with its round icon, description and product count.
 */
export function CatalogMenu({ categories }: { categories: Category[] }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/85 dark:bg-white dark:text-ink"
      >
        {open ? <X className="size-4" /> : <LayoutGrid className="size-4 text-brand" />}
        {t.header.catalog}
      </button>

      {open && categories.length > 0 && (
        <div className="absolute left-0 top-full z-10 mt-3 w-[min(900px,88vw)] overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-2xl shadow-black/10">
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={routes.category(category.slug)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-brand-soft"
                >
                  <CategoryIcon slug={category.slug} size="md" />
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{category.name}</span>
                    {typeof category.products_count === "number" && (
                      <span className="text-xs text-muted-foreground">{category.products_count} {plural(locale, category.products_count, t.common.products)}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={routes.catalog}
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white"
          >
            {t.common.allCatalog}
            <ArrowRight className="size-4 text-brand" />
          </Link>
        </div>
      )}
    </div>
  );
}
