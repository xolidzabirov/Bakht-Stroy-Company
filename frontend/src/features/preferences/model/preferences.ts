import { LOCALE_COOKIE, THEME_COOKIE, type Locale, type Theme } from "@/shared/i18n/config";

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

/** The saved choice; "system" — nothing saved, the device setting decides. */
export function readTheme(): Theme {
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=(light|dark)`));

  return match ? (match[1] as Theme) : "system";
}

/** Light, dark or "as on the device" (forgets the saved choice) — applied right away. */
export function setTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (theme === "system") document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
  else remember(THEME_COOKIE, theme);
}

/** The server renders the texts, so the caller refreshes the page data after this. */
export function saveLocale(locale: Locale) {
  document.documentElement.lang = locale;
  remember(LOCALE_COOKIE, locale);
}
