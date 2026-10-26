import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import type { NewsItem } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui";

export async function NewsCard({ news }: { news: NewsItem }) {
  const { t, locale } = await getI18n();

  return (
    <Link
      href={routes.newsItem(news.slug)}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition hover:shadow-xl hover:shadow-black/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
        {news.cover && (
          <Image
            src={news.cover.card}
            alt={news.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <Badge tone={news.type.value === "promo" ? "brand" : "dark"} className="absolute left-3 top-3">
          {news.type.label}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug group-hover:underline">{news.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{news.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted">
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
