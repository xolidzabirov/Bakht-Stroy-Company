import type { Dictionary } from "./dictionaries";

/**
 * Sections nothing in the shop reads in the browser. Server Components read them on the server,
 * and the admin panel gets the whole dictionary from its own layout (useAdminI18n).
 */
const NOT_IN_BROWSER = ["admin", "meta", "hero", "advantages", "home", "cta", "about", "delivery", "footer", "success", "account"] as const;

export type BrowserDictionary = Omit<Dictionary, (typeof NOT_IN_BROWSER)[number]>;

/** The dictionary travels inside every page: what stays out of it is parsed by no phone. */
export function forBrowser(t: Dictionary): BrowserDictionary {
  const excluded = new Set<string>(NOT_IN_BROWSER);

  return Object.fromEntries(Object.entries(t).filter(([section]) => !excluded.has(section))) as BrowserDictionary;
}
