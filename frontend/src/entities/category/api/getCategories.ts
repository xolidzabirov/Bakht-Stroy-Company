import { apiTry } from "@/shared/api/http";
import type { Category } from "@/shared/api/types";

/**
 * Category tree for menus and the home page. Cached for 5 minutes on the Next.js server.
 */
export async function getCategories(): Promise<Category[]> {
  const response = await apiTry<{ data: Category[] }>("/categories", { revalidate: 300 });

  return response?.data ?? [];
}
