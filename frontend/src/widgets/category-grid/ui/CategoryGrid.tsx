import { CategoryCard } from "@/entities/category/ui/CategoryCard";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { Container, SectionHeading } from "@/shared/ui";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <Container className="mt-16">
      <SectionHeading title="Каталог" subtitle="Все направления Bakht Stroy" href={routes.catalog} linkText="Весь каталог" />
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </Container>
  );
}
