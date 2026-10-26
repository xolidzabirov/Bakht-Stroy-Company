import { NewsCard } from "@/entities/news/ui/NewsCard";
import type { NewsItem } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { Container, SectionHeading } from "@/shared/ui";

export function NewsSection({ news }: { news: NewsItem[] }) {
  if (news.length === 0) return null;

  return (
    <Container className="mt-16">
      <SectionHeading title="Новости и акции" subtitle="Скидки, новинки и советы для стройки" href={routes.news} />
      <div className="grid gap-4 md:grid-cols-3">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    </Container>
  );
}
