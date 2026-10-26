import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/entities/category/api/getCategory";
import type { CatalogSearchParams } from "@/features/product-filters/model/params";
import { routes } from "@/shared/config/site";
import { CatalogListing } from "@/widgets/catalog/ui/CatalogListing";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);

  if (!category) return { title: "Категория не найдена" };

  return {
    title: `${category.name} — купить в Душанбе`,
    description: category.description ?? `${category.name}: цены в сомони, наличие на складе, доставка по Душанбе.`,
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
