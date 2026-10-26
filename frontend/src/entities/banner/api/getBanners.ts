import { apiTry } from "@/shared/api/http";
import type { Banner } from "@/shared/api/types";

export async function getBanners(): Promise<Banner[]> {
  const response = await apiTry<{ data: Banner[] }>("/banners", { revalidate: 300 });

  return response?.data ?? [];
}
