import { NewsCard } from "@/entities/news/ui/NewsCard";
import type { NewsItem } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { SectionHeading } from "@/shared/ui/SectionHeading";

/** Three news cards with a link to /news — on the home page ("Новости и акции") and under a post ("Другие публикации"). */
export async function NewsSection({ news, title, subtitle }: { news: NewsItem[]; title?: string; subtitle?: string }) {
  if (news.length === 0) return null;

  const { t } = await getI18n();

  return (
    <Container className="mt-16">
      <SectionHeading title={title ?? t.home.newsTitle} subtitle={title ? subtitle : (subtitle ?? t.home.newsSubtitle)} href={routes.news} />
      <div className="grid gap-4 md:grid-cols-3">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    </Container>
  );
}
