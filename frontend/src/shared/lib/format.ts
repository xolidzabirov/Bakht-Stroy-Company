import { localeNames, type Locale } from "@/shared/i18n/config";

const money = new Map<Locale, Intl.NumberFormat>();
const dates = new Map<Locale, Intl.DateTimeFormat>();

/**
 * Money from the API is in dirams (1 сомони = 100 дирам): 6550 → "65,5 сом." (ru, tg) or "65.5 TJS" (en).
 */
export function formatMoney(dirams: number | null | undefined, locale: Locale = "ru"): string {
  if (dirams === null || dirams === undefined) {
    return "";
  }

  if (!money.has(locale)) {
    money.set(locale, new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
  }

  return `${money.get(locale)!.format(dirams / 100)} ${locale === "en" ? "TJS" : "сом."}`;
}

/**
 * "+992907666609" → "+992 90 766 66 09".
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("992") && digits.length === 12) {
    return `+992 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }

  return phone;
}

export function formatDate(iso: string | null | undefined, locale: Locale = "ru"): string {
  if (!iso) return "";

  if (!dates.has(locale)) {
    // Tajik month names are not in every runtime — fall back to Russian ones.
    const tag = locale === "tg" && !Intl.DateTimeFormat.supportedLocalesOf("tg").length ? "ru-RU" : localeNames[locale].intl;
    dates.set(locale, new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric" }));
  }

  return dates.get(locale)!.format(new Date(iso));
}
