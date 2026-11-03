import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { plural } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";

export async function CategoryCard({ category }: { category: Category }) {
  const { t, locale } = await getI18n();

  return (
    <Link
      href={routes.category(category.slug)}
      className="group flex items-stretch overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface card-hover"
    >
      <div className="relative w-28 shrink-0 overflow-hidden bg-surface-muted sm:w-36">
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="144px"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className="flex min-h-28 min-w-0 flex-1 items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold leading-snug tracking-tight sm:text-lg">{category.name}</h3>
          {typeof category.products_count === "number" && (
            <p className="mt-1 text-sm text-muted-foreground">{category.products_count} {plural(locale, category.products_count, t.common.products)}</p>
          )}
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}
