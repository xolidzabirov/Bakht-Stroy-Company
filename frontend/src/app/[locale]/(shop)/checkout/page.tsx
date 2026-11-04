import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSettings } from "@/entities/settings/api/getSettings";
import { apiFetch } from "@/shared/api/http";
import { requireCustomer } from "@/shared/api/requireUser";
import { getToken } from "@/shared/api/session";
import type { Address, Cart, ProductDetails } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { Container } from "@/shared/ui";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { CheckoutForm, type CheckoutLines } from "@/widgets/checkout/ui/CheckoutForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.checkout, robots: { index: false } };
}

type Props = { searchParams: Promise<{ product?: string; qty?: string }> };

/** "Беру сразу": the lines of one product; null when it cannot be bought any more. The stepper's limits hold for a typed address too. */
async function oneProduct(slug: string, qty: string | undefined): Promise<{ lines: CheckoutLines; id: number; slug: string } | null> {
  const product = await apiFetch<{ data: ProductDetails }>(`/products/${encodeURIComponent(slug)}`, { cache: "no-store" })
    .then((response) => response.data)
    .catch(() => null);
  if (!product || !product.in_stock) return null;

  const wanted = Number(qty);
  const quantity = Math.min(product.stock, Math.max(1, product.min_order_qty, Number.isInteger(wanted) ? wanted : 1));
  const total = product.price * quantity;
  const image = product.images?.[0] ? { thumb: product.images[0].thumb } : null;

  return { id: product.id, slug: product.slug, lines: { items: [{ id: product.id, product: { name: product.name, image }, quantity, price: product.price, total }], items_count: 1, subtotal: total } };
}

/**
 * Checkout: the cart (or the one product of "Беру сразу"), saved addresses and delivery prices are read here with the user's token;
 * an empty cart or one with problem lines goes back to /cart.
 */
export default async function CheckoutPage({ searchParams }: Props) {
  const { product, qty } = await searchParams;
  const here = product ? routes.buyNow(product, Number(qty) || 1) : routes.checkout;
  const user = await requireCustomer(here);
  const [{ t }, token, settings] = await Promise.all([getI18n(), getToken(), getSettings()]);
  const [one, { data: addresses }] = await Promise.all([
    product ? oneProduct(product, qty) : null,
    apiFetch<{ data: Address[] }>("/me/addresses", { token, cache: "no-store" }),
  ]);
  if (product && !one) redirect(routes.catalog);

  let lines: CheckoutLines;
  if (one) {
    lines = one.lines;
  } else {
    const { data: cart } = await apiFetch<{ data: Cart }>("/cart", { token, cache: "no-store" });
    if (!cart.can_checkout || cart.has_problems) redirect(routes.cart);
    lines = cart;
  }

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: t.nav.home, href: routes.home }, one ? { label: lines.items[0].product?.name ?? "", href: routes.product(one.slug) } : { label: t.cart.title, href: routes.cart }, { label: t.checkout.title }]} />
      <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t.checkout.title}</h1>
      <CheckoutForm cart={lines} buyNow={one ? { product_id: one.id, quantity: lines.items[0].quantity } : undefined} addresses={addresses} user={{ name: user.name, phone: user.phone }} delivery={settings.delivery ?? null} workHours={settings.work_hours} />
    </Container>
  );
}
