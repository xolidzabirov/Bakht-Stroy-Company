import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";

type Props = {
  page: number;
  lastPage: number;
  /** Builds the link of a page, keeping the other query parameters. */
  href: (page: number) => string;
};

/** 1 … 4 5 [6] 7 8 … 20 */
function pages(page: number, lastPage: number): (number | "gap")[] {
  const result: (number | "gap")[] = [];

  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || Math.abs(i - page) <= 2) {
      result.push(i);
    } else if (result.at(-1) !== "gap") {
      result.push("gap");
    }
  }

  return result;
}

export async function Pagination({ page, lastPage, href }: Props) {
  if (lastPage <= 1) return null;

  const { t } = await getI18n();

  const item = "grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-semibold transition";

  return (
    <nav aria-label={t.common.pages} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} aria-label={t.common.prevPage} className={cn(item, "border border-border hover:border-foreground/40")}>
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {pages(page, lastPage).map((value, index) =>
        value === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={value}
            href={href(value)}
            aria-current={value === page ? "page" : undefined}
            className={cn(item, value === page ? "bg-ink text-white dark:bg-white dark:text-ink" : "border border-border hover:border-foreground/40")}
          >
            {value}
          </Link>
        ),
      )}
      {page < lastPage && (
        <Link href={href(page + 1)} aria-label={t.common.nextPage} className={cn(item, "border border-border hover:border-foreground/40")}>
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
