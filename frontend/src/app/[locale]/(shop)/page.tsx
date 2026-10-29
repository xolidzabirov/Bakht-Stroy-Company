import type { Metadata } from "next";
import { getBanners } from "@/entities/banner/api/getBanners";
import { getCategories } from "@/entities/category/api/getCategories";
import { getNews } from "@/entities/news/api/getNews";
import { getProducts } from "@/entities/product/api/getProducts";
import { getSettings } from "@/entities/settings/api/getSettings";
import { routes } from "@/shared/config/site";
import { getI18n, setLocaleFrom } from "@/shared/i18n/server";
import { Advantages } from "@/widgets/advantages/ui/Advantages";
import { CategoryGrid } from "@/widgets/category-grid/ui/CategoryGrid";
import { CategoryStrip } from "@/widgets/category-grid/ui/CategoryStrip";
import { ContactCta } from "@/widgets/contact-cta/ui/ContactCta";
import { Hero } from "@/widgets/hero/ui/Hero";
import { NewsSection } from "@/widgets/news-section/ui/NewsSection";
import { ProductGrid } from "@/widgets/product-grid/ui/ProductGrid";

/** Title and description come from the root layout; the home page only states its address. */
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  await setLocaleFrom(params);
  const [banners, categories, featured, discounted, news, settings] =
    await Promise.all([
      getBanners(),
      getCategories(),
      getProducts({ featured: true, per_page: 8 }),
      getProducts({ sort: "popular", per_page: 60 }),
      getNews({ per_page: 3 }),
      getSettings(),
    ]);
  const { t } = await getI18n();

  const sale = (discounted?.data ?? []).filter(
    (product) => product.discount_percent,
  );

  return (
    <>
      <Hero banners={banners} phone={settings.phones[0]} />
      <CategoryStrip categories={categories} />
      <Advantages />
      <CategoryGrid categories={categories} />
      <ProductGrid
        title={t.home.hitsTitle}
        subtitle={t.home.hitsSubtitle}
        href={`${routes.catalog}?featured=1`}
        products={featured?.data ?? []}
      />
      {sale.length >= 4 && (
        <ProductGrid
          title={t.home.saleTitle}
          subtitle={t.home.saleSubtitle}
          href={routes.catalog}
          products={sale.slice(0, 4)}
        />
      )}
      <NewsSection news={news?.data ?? []} />
      <ContactCta
        phone={settings.phones[0]}
        whatsapp={settings.socials?.whatsapp}
        telegram={settings.socials?.telegram}
        telegramChat={settings.socials?.telegram_chat}
      />
    </>
  );
}
