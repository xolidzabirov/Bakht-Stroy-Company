import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { EmptyState } from "@/widgets/empty-state/ui/EmptyState";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.cart, robots: { index: false } };
}

export default async function CartPage() {
  await requireUser(routes.cart);
  const { t } = await getI18n();

  return <EmptyState icon={ShoppingCart} title={t.empty.cartTitle} text={t.empty.cartText} />;
}
