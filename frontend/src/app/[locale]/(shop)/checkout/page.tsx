import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSettings } from "@/entities/settings/api/getSettings";
import { apiFetch } from "@/shared/api/http";
import { requireUser } from "@/shared/api/requireUser";
import { getToken } from "@/shared/api/session";
import type { Address, Cart } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { CheckoutForm } from "@/widgets/checkout/ui/CheckoutForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.checkout, robots: { index: false } };
}

/**
 * Checkout: the cart, saved addresses and delivery prices are read here with the user's token;
 * an empty cart or one with problem lines goes back to /cart.
 */
export default async function CheckoutPage() {
  const user = await requireUser(routes.checkout);
  const [{ t }, token, settings] = await Promise.all([getI18n(), getToken(), getSettings()]);
  const [{ data: cart }, { data: addresses }] = await Promise.all([
    apiFetch<{ data: Cart }>("/cart", { token, cache: "no-store" }),
    apiFetch<{ data: Address[] }>("/me/addresses", { token, cache: "no-store" }),
  ]);

  if (!cart.can_checkout || cart.has_problems) redirect(routes.cart);

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, { label: t.cart.title, href: routes.cart }, { label: t.checkout.title }]} />
      <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t.checkout.title}</h1>
      <CheckoutForm cart={cart} addresses={addresses} user={{ name: user.name, phone: user.phone }} delivery={settings.delivery ?? null} workHours={settings.work_hours} />
    </Container>
  );
}
