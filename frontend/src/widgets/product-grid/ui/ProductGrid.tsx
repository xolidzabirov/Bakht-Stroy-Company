import { ShopProductCard } from "@/widgets/product-grid/ui/ShopProductCard";
import type { Product } from "@/shared/api/types";
import { Container } from "@/shared/ui";
import { SectionHeading } from "@/shared/ui/SectionHeading";
import { ProductSlider } from "./ProductSlider";

type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  products: Product[];
  asSlider?: boolean;
};

export function ProductGrid({ title, subtitle, href, products, asSlider = true }: Props) {
  if (products.length === 0) return null;

  return (
    <Container className="mt-20 sm:mt-28">
      <SectionHeading title={title} subtitle={subtitle} href={href} />
      {asSlider ? (
        <ProductSlider className="reveal-items mt-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[calc(50%-0.375rem)] min-w-[160px] sm:w-[calc(33.333%-0.67rem)] lg:w-[calc(25%-0.75rem)] shrink-0 flex-none snap-start"
            >
              <ShopProductCard product={product} />
            </div>
          ))}
        </ProductSlider>
      ) : (
        <div className="reveal-items grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
