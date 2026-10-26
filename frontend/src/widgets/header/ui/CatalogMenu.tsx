"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, LayoutGrid, X } from "lucide-react";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { cn } from "@/shared/lib/cn";

/**
 * "Каталог" button with a mega menu: root categories on the left, subcategories on the right.
 */
export function CatalogMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
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

  const current = categories[active];
  const children = current?.children ?? [];

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/85 dark:bg-white dark:text-ink"
      >
        {open ? <X className="size-4" /> : <LayoutGrid className="size-4 text-brand" />}
        Каталог
      </button>

      {open && categories.length > 0 && (
        <div className="absolute left-0 top-full mt-3 flex w-[min(860px,85vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/10">
          <ul className="w-72 shrink-0 border-r border-border bg-surface-muted p-2">
            {categories.map((category, index) => (
              <li key={category.id}>
                <Link
                  href={routes.category(category.slug)}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    index === active ? "bg-surface shadow-sm" : "hover:bg-surface/60",
                  )}
                >
                  {category.image && (
                    <Image src={category.image} alt="" width={32} height={32} className="size-8 rounded-lg object-cover" />
                  )}
                  <span className="flex-1">{category.name}</span>
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex-1 p-6">
            {current && (
              <>
                <Link
                  href={routes.category(current.slug)}
                  onClick={() => setOpen(false)}
                  className="font-display text-xl font-extrabold hover:underline"
                >
                  {current.name}
                </Link>
                {current.description && <p className="mt-1 text-sm text-muted">{current.description}</p>}
                <ul className="mt-5 grid grid-cols-2 gap-2">
                  {children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={routes.category(child.slug)}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:border-brand hover:bg-brand-soft"
                      >
                        {child.name}
                        {typeof child.products_count === "number" && (
                          <span className="text-xs text-muted">{child.products_count}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
