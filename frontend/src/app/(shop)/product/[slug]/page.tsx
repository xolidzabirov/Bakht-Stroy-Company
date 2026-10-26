import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/entities/product/api/getProduct";
import { getSettings } from "@/entities/settings/api/getSettings";
import { env } from "@/shared/config/env";
import { routes } from "@/shared/config/site";
import { Breadcrumbs, Container } from "@/shared/ui";
import { ProductDetailsView } from "@/widgets/product-details/ui/ProductDetailsView";
import { ProductGrid } from "@/widgets/product-grid/ui/ProductGrid";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);

  if (!product) return { title: "Товар не найден" };

  return {
    title: `${product.name} — цена ${product.price / 100} сом. за ${product.unit.label}`,
    description: product.description?.slice(0, 160),
    alternates: { canonical: routes.product(product.slug) },
    openGraph: { images: product.image ? [product.image.card] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, related, settings] = await Promise.all([getProduct(slug), getRelatedProducts(slug), getSettings()]);

  if (!product) notFound();

  // Structured data for Google: price, currency and stock.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: product.images?.map((image) => image.full),
    description: product.description,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "TJS",
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${env.siteUrl}${routes.product(product.slug)}`,
    },
  };

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: "Главная", href: routes.home },
            { label: "Каталог", href: routes.catalog },
            ...(product.category ? [{ label: product.category.name, href: routes.category(product.category.slug) }] : []),
            { label: product.name },
          ]}
        />
        <div className="mt-6">
          <ProductDetailsView product={product} phone={settings.phones[0]} whatsapp={settings.socials?.whatsapp} delivery={settings.delivery} />
        </div>
      </Container>

      <ProductGrid
        title="Похожие товары"
        href={product.category ? routes.category(product.category.slug) : undefined}
        products={related.slice(0, 4)}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
