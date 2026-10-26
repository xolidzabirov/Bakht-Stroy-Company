import type { Metadata } from "next";
import type { CatalogSearchParams } from "@/features/product-filters/model/params";
import { CatalogListing } from "@/widgets/catalog/ui/CatalogListing";

export const metadata: Metadata = {
  title: "Каталог строительных материалов",
  description: "Асфальт, цемент и бетон, кирпич, арматура, окна и двери, сантехника, краски, бытовая техника и оборудование — цены в сомони, доставка по Душанбе.",
  alternates: { canonical: "/catalog" },
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <CatalogListing params={await searchParams} />;
}
