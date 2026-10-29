/**
 * Google Maps links for the store: by the coordinates when the admin set them in the settings, otherwise by the address.
 * No API key needed: the embed is the public "output=embed" map, the route opens Google Maps (app or site).
 */
export function mapLinks(address: string | null | undefined, map: { lat: number | null; lng: number | null } | undefined): { embed: string; route: string } | null {
  const query = map?.lat != null && map?.lng != null ? `${map.lat},${map.lng}` : address;

  if (!query) return null;

  const q = encodeURIComponent(query);

  return {
    embed: `https://maps.google.com/maps?q=${q}&z=16&output=embed`,
    route: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  };
}
