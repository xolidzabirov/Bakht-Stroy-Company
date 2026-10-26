import { CategoryCard } from "@/entities/category/ui/CategoryCard";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { SectionHeading } from "@/shared/ui/SectionHeading";

export async function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  const { t } = await getI18n();

  return (
    <Container className="mt-16">
      <SectionHeading title={t.home.catalogTitle} subtitle={t.home.catalogSubtitle} href={routes.catalog} linkText={t.common.allCatalog} />
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </Container>
  );
}
