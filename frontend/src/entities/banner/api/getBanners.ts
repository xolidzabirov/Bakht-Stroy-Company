import { apiTry } from "@/shared/api/http";
import type { Banner } from "@/shared/api/types";

/** promo — the banners strip under the first screen; hero — the photo carousel of the first screen. */
export async function getBanners(placement: "promo" | "hero" = "promo"): Promise<Banner[]> {
  const response = await apiTry<{ data: Banner[] }>(`/banners?placement=${placement}`, { revalidate: 300 });

  return response?.data ?? [];
}
