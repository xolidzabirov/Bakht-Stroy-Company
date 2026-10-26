import { ProductCard } from "@/entities/product/ui/ProductCard";
import type { Product } from "@/shared/api/types";
import { Container, SectionHeading } from "@/shared/ui";

type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  products: Product[];
};

export function ProductGrid({ title, subtitle, href, products }: Props) {
  if (products.length === 0) return null;

  return (
    <Container className="mt-16">
      <SectionHeading title={title} subtitle={subtitle} href={href} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
