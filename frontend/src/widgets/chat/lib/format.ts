import type { Locale } from "@/shared/i18n/config";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { fmt } from "@/shared/i18n/format";
import { formatDate } from "@/shared/lib/format";

const tag = (locale: Locale) => (locale === "en" ? "en-GB" : "ru-RU");

/** "14:05" */
export function chatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(tag(locale), { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function sameDay(a: string, b: string): boolean {
  return dayKey(new Date(a)) === dayKey(new Date(b));
}

/** "Сегодня", "Вчера" or "12 октября 2026" above each day of the conversation. */
export function dayLabel(iso: string, locale: Locale, t: Dictionary["chat"]): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) return t.today;
  if (dayKey(date) === dayKey(yesterday)) return t.yesterday;

  return formatDate(iso, locale);
}

/** "в сети" / "был(а) в сети в 14:05" / "был(а) в сети вчера" / "был(а) в сети давно". */
export function presence(online: boolean, lastSeen: string | null, locale: Locale, t: Dictionary["chat"]): string {
  if (online) return t.online;
  if (!lastSeen) return t.lastSeenLong;

  const day = dayLabel(lastSeen, locale, t);
  const time = chatTime(lastSeen, locale);
  const when = day === t.today ? time : day === t.yesterday ? `${day.toLowerCase()} ${time}` : day;

  return fmt(t.lastSeen, { time: when });
}

/** 1536000 → "1,5 МБ" */
export function fileSize(bytes: number, locale: Locale): string {
  const units = locale === "en" ? ["B", "KB", "MB"] : ["Б", "КБ", "МБ"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${new Intl.NumberFormat(tag(locale), { maximumFractionDigits: unit ? 1 : 0 }).format(value)} ${units[unit]}`;
}

/** Links in message text become clickable. */
export const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;
