import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { apiFetch } from "@/shared/api/http";
import { requireUser } from "@/shared/api/requireUser";
import { getToken } from "@/shared/api/session";
import type { Paginated, Product } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { plural } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { EmptyState } from "@/widgets/empty-state/ui/EmptyState";
import { ShopProductCard } from "@/widgets/product-grid/ui/ShopProductCard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.favorites, robots: { index: false } };
}

/**
 * Saved products. Removing a heart here hides the card on the next visit (the list is the server's).
 */
export default async function FavoritesPage() {
  await requireUser(routes.favorites);
  const [{ t, locale }, token] = await Promise.all([getI18n(), getToken()]);
  const { data: products } = await apiFetch<Paginated<Product>>("/favorites?per_page=60", { token, cache: "no-store" });

  if (products.length === 0) {
    return <EmptyState icon={Heart} title={t.empty.favoritesTitle} text={t.empty.favoritesText} />;
  }

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: t.favorites.title }]} />
      <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t.favorites.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {products.length} {plural(locale, products.length, t.common.products)}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ShopProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
