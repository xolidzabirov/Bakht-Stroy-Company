import { cache } from "react";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

/**
 * Language of the current request for Server Components.
 *
 * The proxy puts the visitor's language into the hidden [locale] segment (/catalog → /ru/catalog),
 * so public pages can be prerendered once per language and served from the cache.
 * Every layout, page and generateMetadata under [locale] calls setRequestLocale() first:
 * Next.js renders them in parallel, and each one must know the language before its components read it.
 */
const requestLocale = cache((): { locale: Locale | null } => ({ locale: null }));

export function setRequestLocale(locale: string): Locale {
  const value = isLocale(locale) ? locale : defaultLocale;
  requestLocale().locale = value;

  return value;
}

/** Shortcut for `params` of a [locale] page or layout. */
export async function setLocaleFrom(params: Promise<{ locale: string }>): Promise<Locale> {
  return setRequestLocale((await params).locale);
}

/**
 * The language and its texts. Without setRequestLocale (a dynamic page that skipped it) the cookie decides —
 * that makes the page dynamic, which such pages already are.
 */
export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  let locale = requestLocale().locale;

  if (!locale) {
    const value = (await cookies()).get(LOCALE_COOKIE)?.value;
    locale = isLocale(value) ? value : defaultLocale;
  }

  return { locale, t: dictionaries[locale] };
}
