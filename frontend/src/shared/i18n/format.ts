import type { Locale } from "./config";

/** "Здравствуйте, {name}!" + { name: "Фирдавс" } */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/**
 * Word form for a number: ru — [1 товар, 2 товара, 5 товаров], en — [1 item, 2 items], tg — one form.
 */
export function plural(locale: Locale, n: number, forms: readonly string[]): string {
  if (locale === "ru") {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1] ?? forms[0];
    return forms[2] ?? forms[0];
  }

  if (locale === "en") return n === 1 ? forms[0] : (forms[1] ?? forms[0]);

  return forms[0];
}
