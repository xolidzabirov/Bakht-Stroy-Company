import type { MetadataRoute } from "next";
import { getCategories } from "@/entities/category/api/getCategories";
import { getNews } from "@/entities/news/api/getNews";
import { getProducts } from "@/entities/product/api/getProducts";
import { env } from "@/shared/config/env";
import { routes } from "@/shared/config/site";

/** Rebuilt once an hour: new products and posts reach search engines without a deploy. */
export const revalidate = 3600;

const MAX_PAGES = 20;

/** Walks through every page of a paginated list (up to MAX_PAGES pages). */
async function collect<T>(load: (page: number) => Promise<{ data: T[]; meta: { last_page: number } } | null>): Promise<T[]> {
  const first = await load(1);
  if (!first) return [];

  const rest = await Promise.all(Array.from({ length: Math.min(first.meta.last_page, MAX_PAGES) - 1 }, (_, i) => load(i + 2)));

  return [first, ...rest].flatMap((page) => page?.data ?? []);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${env.siteUrl}${path}`;
  const [categories, products, news] = await Promise.all([
    getCategories(),
    collect((page) => getProducts({ page, per_page: 60 })),
    collect((page) => getNews({ page, per_page: 50 })),
  ]);

  return [
    { url: url(routes.home), changeFrequency: "daily", priority: 1 },
    { url: url(routes.catalog), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({ url: url(routes.category(category.slug)), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: url(routes.product(product.slug)), changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: url(routes.news), changeFrequency: "daily", priority: 0.6 },
    ...news.map((item) => ({
      url: url(routes.newsItem(item.slug)),
      lastModified: item.published_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...[routes.about, routes.delivery, routes.contacts].map((path) => ({ url: url(path), changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
