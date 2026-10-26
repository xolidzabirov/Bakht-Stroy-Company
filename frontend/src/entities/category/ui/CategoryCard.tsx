import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";

export function CategoryCard({ category }: { category: Category }) {
  const children = Array.isArray(category.children) ? category.children : [];

  return (
    <Link
      href={routes.category(category.slug)}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-ink opacity-0 transition group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold leading-snug sm:text-lg">{category.name}</h3>
        {typeof category.products_count === "number" && (
          <p className="mt-1 text-sm text-muted">{category.products_count} товаров</p>
        )}
        {children.length > 0 && (
          <p className="mt-3 line-clamp-2 text-xs text-muted">{children.map((child) => child.name).join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}
