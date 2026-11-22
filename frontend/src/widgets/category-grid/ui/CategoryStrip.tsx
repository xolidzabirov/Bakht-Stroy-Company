import Link from "next/link";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { Container } from "@/shared/ui";
import { Marquee } from "@/shared/ui/Marquee";

/**
 * Round category icons in an endless slow row; the mouse over it stops the row, so a category is easy to press.
 * Arrows appear on the side the mouse is at and move the row by a press.
 */
export function CategoryStrip({ categories, arrows }: { categories: Category[]; arrows: { back: string; forward: string } }) {
  if (categories.length === 0) return null;

  return (
    <Container className="mt-10">
      <Marquee seconds={Math.max(50, categories.length * 9)} arrows={arrows} className="[--marquee-arrow-top:3rem] [--marquee-gap:1.25rem] sm:[--marquee-arrow-top:3.5rem] sm:[--marquee-gap:1.75rem] [&>.marquee]:py-2">
        {(copy) =>
          categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link prefetch={false} href={routes.category(category.slug)} tabIndex={copy ? -1 : undefined} className="group flex w-24 flex-col items-center gap-3 text-center sm:w-32">
                <CategoryIcon slug={category.slug} size="lg" className="transition duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-lg" />
                <span className="text-xs font-semibold leading-tight transition-colors group-hover:text-foreground sm:text-sm">{category.name}</span>
              </Link>
            </li>
          ))
        }
      </Marquee>
    </Container>
  );
}
