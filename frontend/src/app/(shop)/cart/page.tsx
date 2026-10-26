import type { Metadata } from "next";
import { getSettings } from "@/entities/settings/api/getSettings";
import { apiFetch } from "@/shared/api/http";
import { requireUser } from "@/shared/api/requireUser";
import { getToken } from "@/shared/api/session";
import type { Cart } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { CartView } from "@/widgets/cart/ui/CartView";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.cart, robots: { index: false } };
}

/**
 * Cart: the first render already has the lines (fetched here with the user's token),
 * then the client keeps it up to date.
 */
export default async function CartPage() {
  await requireUser(routes.cart);
  const [{ t }, token, settings] = await Promise.all([getI18n(), getToken(), getSettings()]);
  const { data: cart } = await apiFetch<{ data: Cart }>("/cart", { token, cache: "no-store" });

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: t.cart.title }]} />
      <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t.cart.title}</h1>
      <CartView initialCart={cart} delivery={settings.delivery} />
    </Container>
  );
}
