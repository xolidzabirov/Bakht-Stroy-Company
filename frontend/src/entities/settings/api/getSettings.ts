import { apiTry } from "@/shared/api/http";
import type { StoreSettings } from "@/shared/api/types";
import { site } from "@/shared/config/site";

/**
 * Contacts, delivery and payment settings from the admin panel,
 * with the static company data as a fallback when the API is unavailable.
 */
export async function getSettings(): Promise<StoreSettings["store"] & { delivery?: StoreSettings["delivery"] }> {
  const response = await apiTry<{ data: StoreSettings }>("/settings/public", { revalidate: 600 });

  if (!response) {
    return {
      name: site.name,
      description: site.tagline,
      phones: [...site.phones],
      email: site.email,
      address: site.address,
      work_hours: site.workHours,
      map: { lat: null, lng: null },
      socials: { ...site.socials },
    };
  }

  return { ...response.data.store, delivery: response.data.delivery };
}
