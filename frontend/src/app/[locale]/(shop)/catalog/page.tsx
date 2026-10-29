import type { Metadata } from "next";
import type { CatalogSearchParams } from "@/features/product-filters/model/params";
import { getI18n } from "@/shared/i18n/server";
import { CatalogListing } from "@/widgets/catalog/ui/CatalogListing";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return { title: t.meta.catalog, description: t.meta.catalogDescription, alternates: { canonical: "/catalog" } };
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <CatalogListing params={await searchParams} />;
}
