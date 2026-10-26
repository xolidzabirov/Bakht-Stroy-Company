/**
 * Interface languages. The choice is kept in a cookie, so page addresses stay the same for every language.
 * Catalog content (products, categories, news) comes from the API in Russian.
 */
export const locales = ["ru", "tg", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const LOCALE_COOKIE = "bakht_locale";

export const localeNames: Record<Locale, { short: string; name: string; intl: string }> = {
  ru: { short: "RU", name: "Русский", intl: "ru-RU" },
  tg: { short: "TJ", name: "Тоҷикӣ", intl: "tg-TJ" },
  en: { short: "EN", name: "English", intl: "en-US" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

/** Color theme: "system" follows the device setting. */
export const themes = ["light", "dark", "system"] as const;

export type Theme = (typeof themes)[number];

export const THEME_COOKIE = "bakht_theme";

export function isTheme(value: string | undefined | null): value is Theme {
  return themes.includes(value as Theme);
}

