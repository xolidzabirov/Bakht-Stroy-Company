import type { Category } from "@/shared/api/types";

export type CategoryOption = { id: number; slug: string; label: string; depth: number };

/** The admin category tree as a flat list for selects: children are indented under their parent. */
export function flattenCategories(roots: Category[], depth = 0): CategoryOption[] {
  return roots.flatMap((category) => [
    { id: category.id, slug: category.slug, label: `${"— ".repeat(depth)}${category.name}`, depth },
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

/** "75,50" / "75.5" / "75" → 7550 dirams; null for an empty or invalid value. */
export function somoniToDirams(value: string): number | null {
  const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** 7550 → "75,50", 7500 → "75". */
export function diramsToSomoni(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const somoni = value / 100;
  return Number.isInteger(somoni) ? String(somoni) : somoni.toFixed(2).replace(".", ",");
}
