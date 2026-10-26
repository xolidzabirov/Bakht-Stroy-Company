import { cache } from "react";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, isTheme, LOCALE_COOKIE, THEME_COOKIE, type Locale, type Theme } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

/**
 * Language and theme of the visitor for Server Components (read once per request).
 */
export const getI18n = cache(async (): Promise<{ locale: Locale; t: Dictionary }> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(value) ? value : defaultLocale;

  return { locale, t: dictionaries[locale] };
});

export const getTheme = cache(async (): Promise<Theme> => {
  const value = (await cookies()).get(THEME_COOKIE)?.value;

  return isTheme(value) ? value : "system";
});
