import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getI18n } from "@/shared/i18n/server";

export type Crumb = { label: string; href?: string };

/**
 * "Главная › Каталог › Цемент и бетон". The last crumb is the current page (no link).
 */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = await getI18n();

  return (
    <nav aria-label={t.common.breadcrumbs} className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
