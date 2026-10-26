import { NewsCard } from "@/entities/news/ui/NewsCard";
import type { NewsItem } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { SectionHeading } from "@/shared/ui/SectionHeading";

export async function NewsSection({ news }: { news: NewsItem[] }) {
  if (news.length === 0) return null;

  const { t } = await getI18n();

  return (
    <Container className="mt-16">
      <SectionHeading title={t.home.newsTitle} subtitle={t.home.newsSubtitle} href={routes.news} />
      <div className="grid gap-4 md:grid-cols-3">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    </Container>
  );
}
