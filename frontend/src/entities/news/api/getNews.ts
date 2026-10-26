import { apiTry } from "@/shared/api/http";
import type { NewsItem, Paginated } from "@/shared/api/types";

export async function getNews(params: { type?: string; per_page?: number; page?: number } = {}): Promise<Paginated<NewsItem> | null> {
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (value === undefined ? [] : [[key, String(value)]])),
  ).toString();

  return apiTry<Paginated<NewsItem>>(`/news${query ? `?${query}` : ""}`, { revalidate: 300 });
}
