import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { EmptyState } from "@/widgets/empty-state/ui/EmptyState";

export const metadata: Metadata = { title: "Корзина", robots: { index: false } };

export default async function CartPage() {
  await requireUser(routes.cart);

  return <EmptyState icon={ShoppingCart} title="Корзина" text="Здесь появятся товары, которые вы добавите из каталога. Оформление заказа — прямо отсюда." />;
}
