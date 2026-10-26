import { LOCALE_COOKIE, THEME_COOKIE, type Locale } from "@/shared/i18n/config";

/** Remembers a visitor preference for a year (read by the server on the next request). */
function remember(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

/** Light ↔ dark right away, no reload. */
export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";

  document.documentElement.dataset.theme = next;
  remember(THEME_COOKIE, next);
}

/** The server renders the texts, so the caller refreshes the page data after this. */
export function saveLocale(locale: Locale) {
  document.documentElement.lang = locale;
  remember(LOCALE_COOKIE, locale);
}
