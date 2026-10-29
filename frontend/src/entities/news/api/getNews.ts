import { cache } from "react";
import { apiTry } from "@/shared/api/http";
import type { NewsDetails, NewsItem, Paginated } from "@/shared/api/types";

export type NewsTypeTab = { value: string; label: string; count: number };

export async function getNews(params: { type?: string; per_page?: number; page?: number } = {}): Promise<Paginated<NewsItem> | null> {
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (value === undefined ? [] : [[key, String(value)]])),
  ).toString();

  return apiTry<Paginated<NewsItem>>(`/news${query ? `?${query}` : ""}`, { revalidate: 300 });
}

/** Tabs of /news: every type with the number of published posts. */
export async function getNewsTypes(): Promise<NewsTypeTab[]> {
  const response = await apiTry<{ data: NewsTypeTab[] }>("/news/types", { revalidate: 300 });

  return response?.data ?? [];
}

/**
 * One post with its gallery, products, neighbours and related posts; null when it does not exist (or the API is down).
 * Cached for 5 minutes (views are counted from the browser by <TrackView>); cache() lets the metadata and the page share it.
 */
export const getNewsItem = cache(async (slug: string): Promise<NewsDetails | null> => {
  const response = await apiTry<{ data: NewsDetails }>(`/news/${encodeURIComponent(slug)}`, { revalidate: 300 });

  return response?.data ?? null;
});
