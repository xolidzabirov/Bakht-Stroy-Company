const somoniFormatter = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * Money from the API is in dirams (1 сомони = 100 дирам): 6550 → "65,5 сом.".
 */
export function formatMoney(dirams: number | null | undefined): string {
  if (dirams === null || dirams === undefined) {
    return "";
  }

  return `${somoniFormatter.format(dirams / 100)} сом.`;
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

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFormatter.format(new Date(iso)) : "";
}
