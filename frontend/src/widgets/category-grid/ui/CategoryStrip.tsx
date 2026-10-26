import Link from "next/link";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { Container } from "@/shared/ui";

/**
 * Row of round category icons like the Instagram highlights; scrolls sideways on phones.
 */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <Container className="mt-10">
      <ul className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 pt-2 [scrollbar-width:none] sm:gap-7 lg:justify-between">
        {categories.map((category) => (
          <li key={category.id} className="snap-start">
            <Link href={routes.category(category.slug)} className="group flex w-24 flex-col items-center gap-3 text-center sm:w-28">
              <CategoryIcon slug={category.slug} size="lg" className="transition group-hover:-translate-y-1 group-hover:shadow-lg" />
              <span className="text-xs font-semibold leading-tight sm:text-sm">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
