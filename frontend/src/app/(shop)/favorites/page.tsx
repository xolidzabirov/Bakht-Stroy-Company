import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { EmptyState } from "@/widgets/empty-state/ui/EmptyState";

export const metadata: Metadata = { title: "Избранное", robots: { index: false } };

export default async function FavoritesPage() {
  await requireUser(routes.favorites);

  return <EmptyState icon={Heart} title="Избранное" text="Сохраняйте нужные материалы сердечком на карточке товара — они будут ждать вас здесь." />;
}
