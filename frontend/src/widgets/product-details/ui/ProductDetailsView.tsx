import Link from "next/link";
import { Banknote, Check, MessageCircle, Phone, Truck, X } from "lucide-react";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";
import { FavoriteButton } from "@/features/toggle-favorite/ui/FavoriteButton";
import type { ProductDetails } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { formatMoney, formatPhone } from "@/shared/lib/format";
import { Badge } from "@/shared/ui";
import { ProductGallery } from "./ProductGallery";

type Props = {
  product: ProductDetails;
  phone?: string;
  whatsapp?: string | null;
  delivery?: { price: number; free_from: number } | null;
};

/**
 * Product page: gallery on the left, price, stock and buying on the right, then specs and description.
 */
export async function ProductDetailsView({ product, phone, whatsapp, delivery }: Props) {
  const { t, locale } = await getI18n();
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const unit = product.unit.label;
  const money = (value: number | null | undefined) => formatMoney(value, locale);
  const whatsappText = encodeURIComponent(fmt(t.product.whatsappText, { name: product.name, sku: product.sku ?? "" }));

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={images}
          name={product.name}
          badges={
            <>
              {product.discount_percent ? <Badge tone="danger" className="bg-danger text-sm text-white">−{product.discount_percent}%</Badge> : null}
              {product.is_featured && <Badge className="text-sm">{t.common.hitLong}</Badge>}
            </>
          }
        />

        <div>
          {product.category && (
            <Link href={routes.category(product.category.slug)} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{fmt(t.product.sku, { sku: product.sku ?? "" })}</p>

          <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold">{money(product.price)}</span>
              <span className="text-muted-foreground">{fmt(t.common.perUnit, { unit })}</span>
              {product.old_price ? <span className="text-lg text-muted-foreground line-through">{money(product.old_price)}</span> : null}
            </div>

            <ul className="mt-4 space-y-1.5 text-sm">
              <li className={product.in_stock ? "flex items-center gap-2 font-semibold text-success" : "flex items-center gap-2 font-semibold text-danger"}>
                {product.in_stock ? <Check className="size-4" /> : <X className="size-4" />}
                {product.in_stock ? fmt(t.product.inStockQty, { qty: product.stock, unit }) : t.product.outOfStock}
              </li>
              {product.min_order_qty > 1 && (
                <li className="text-muted-foreground">{fmt(t.product.minOrder, { qty: product.min_order_qty, unit, sum: money(product.price * product.min_order_qty) })}</li>
              )}
            </ul>

            <AddToCartButton product={product} variant="page" className="mt-6" />
            <div className="mt-3 flex flex-wrap gap-2">
              <FavoriteButton productId={product.id} withLabel />
              {whatsapp ? (
                <a
                  href={`${whatsapp}?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold transition hover:border-foreground/40"
                >
                  <MessageCircle className="size-[18px]" />
                  {t.product.askWhatsapp}
                </a>
              ) : null}
            </div>
          </div>

          <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <li className="flex gap-3 rounded-2xl bg-surface-muted p-4">
              <Truck className="size-5 shrink-0 text-brand" />
              <span>
                <b className="block">{t.product.deliveryTitle}</b>
                {delivery ? fmt(t.product.deliveryText, { price: money(delivery.price), free: money(delivery.free_from) }) : t.product.deliveryFallback}
              </span>
            </li>
            <li className="flex gap-3 rounded-2xl bg-surface-muted p-4">
              <Banknote className="size-5 shrink-0 text-brand" />
              <span>
                <b className="block">{t.product.paymentTitle}</b>
                {t.product.paymentText}{" "}
                <Link href={routes.delivery} className="underline">
                  {t.product.more}
                </Link>
              </span>
            </li>
          </ul>

          {phone && (
            <a href={`tel:${phone}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:text-brand">
              <Phone className="size-4 text-brand" />
              {fmt(t.product.callUs, { phone: formatPhone(phone) })}
            </a>
          )}
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {product.specs.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold">{t.product.specs}</h2>
            <dl className="mt-4 divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
              <div className="flex justify-between gap-4 px-5 py-3 text-sm">
                <dt className="text-muted-foreground">{t.product.unit}</dt>
                <dd className="text-right font-semibold">{unit}</dd>
              </div>
              {product.specs.map((spec) => (
                <div key={spec.name} className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <dt className="text-muted-foreground">{spec.name}</dt>
                  <dd className="text-right font-semibold">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {product.description && (
          <section>
            <h2 className="text-xl font-extrabold">{t.product.description}</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/80">{product.description}</p>
          </section>
        )}
      </div>
    </>
  );
}
