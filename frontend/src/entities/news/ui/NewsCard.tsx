import Link from "next/link";
import { Clock } from "lucide-react";
import type { NewsItem } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui";

/** `headingLevel`: h2 where the cards are the main list (/news), h3 under a section heading. */
export async function NewsCard({ news, headingLevel: Heading = "h3" }: { news: NewsItem; headingLevel?: "h2" | "h3" }) {
  const { t, locale } = await getI18n();

  return (
    <Link
      prefetch={false}
      href={routes.newsItem(news.slug)}
      className="lazy-render group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
        {news.cover && (
          // eslint-disable-next-line @next/next/no-img-element -- ready WebP size from the backend; a plain tag costs the browser no script
          <img
            src={news.cover.card}
            alt={news.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <Badge tone={news.type.value === "promo" ? "brand" : "dark"} className="absolute left-3 top-3">
          {t.news.types[news.type.value] ?? news.type.label}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Heading className="font-display text-lg font-bold leading-snug">{news.title}</Heading>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{news.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
          <span>{formatDate(news.published_at, locale)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {news.reading_time} {t.common.minutes}
          </span>
        </div>
      </div>
    </Link>
  );
}
