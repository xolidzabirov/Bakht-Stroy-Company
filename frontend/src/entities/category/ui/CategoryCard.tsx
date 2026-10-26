import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { plural } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { CategoryIcon } from "./CategoryIcon";

export async function CategoryCard({ category }: { category: Category }) {
  const { t, locale } = await getI18n();

  return (
    <Link
      href={routes.category(category.slug)}
      className="group flex overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition hover:-translate-y-0.5 hover:border-brand hover:shadow-xl hover:shadow-black/5"
    >
      <div className="relative w-28 shrink-0 overflow-hidden bg-surface-muted sm:w-36">
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="144px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <CategoryIcon slug={category.slug} size="sm" />
          <ArrowUpRight className="size-5 text-muted transition group-hover:text-ink" />
        </div>
        <h3 className="font-display text-base font-bold leading-snug sm:text-lg">{category.name}</h3>
        {category.description && <p className="line-clamp-2 text-xs text-muted sm:text-sm">{category.description}</p>}
        {typeof category.products_count === "number" && (
          <p className="mt-auto text-xs font-semibold text-foreground">{category.products_count} {plural(locale, category.products_count, t.common.products)}</p>
        )}
      </div>
    </Link>
  );
}
