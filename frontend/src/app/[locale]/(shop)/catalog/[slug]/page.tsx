import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/entities/category/api/getCategory";
import type { CatalogSearchParams } from "@/features/product-filters/model/params";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { CatalogListing } from "@/widgets/catalog/ui/CatalogListing";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [category, { t }] = await Promise.all([getCategory((await params).slug), getI18n()]);

  if (!category) return { title: t.meta.categoryNotFound };

  return {
    title: fmt(t.meta.category, { name: category.name }),
    description: category.description ?? fmt(t.meta.categoryDescription, { name: category.name }),
    alternates: { canonical: routes.category(category.slug) },
    openGraph: { images: category.image ? [category.image] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);

  if (!category) notFound();

  return <CatalogListing category={category} params={query} />;
}
