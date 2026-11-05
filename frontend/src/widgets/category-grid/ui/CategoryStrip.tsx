import Link from "next/link";
import { CategoryIcon } from "@/entities/category/ui/CategoryIcon";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { Marquee } from "@/shared/ui/Marquee";

/**
 * Round category icons in an endless slow row; the mouse over it stops the row, so a category is easy to press.
 */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="mt-10">
      <Marquee seconds={Math.max(50, categories.length * 9)} className="py-2 [--marquee-gap:1.25rem] sm:[--marquee-gap:1.75rem]">
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
    </div>
  );
}
