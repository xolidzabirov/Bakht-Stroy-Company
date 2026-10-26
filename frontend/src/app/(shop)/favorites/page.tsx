import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { EmptyState } from "@/widgets/empty-state/ui/EmptyState";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.favorites, robots: { index: false } };
}

export default async function FavoritesPage() {
  await requireUser(routes.favorites);
  const { t } = await getI18n();

  return <EmptyState icon={Heart} title={t.empty.favoritesTitle} text={t.empty.favoritesText} />;
}
