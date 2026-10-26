import Link from "next/link";
import { Banknote, Check, MessageCircle, Phone, ShoppingCart, Truck, X } from "lucide-react";
import type { ProductDetails } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { formatMoney, formatPhone } from "@/shared/lib/format";
import { Badge, ButtonLink } from "@/shared/ui";
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
export function ProductDetailsView({ product, phone, whatsapp, delivery }: Props) {
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const unit = product.unit.label;
  const whatsappText = encodeURIComponent(`Здравствуйте! Интересует «${product.name}» (арт. ${product.sku}). `);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={images}
          name={product.name}
          badges={
            <>
              {product.discount_percent ? <Badge tone="danger" className="bg-danger text-sm text-white">−{product.discount_percent}%</Badge> : null}
              {product.is_featured && <Badge className="text-sm">Хит продаж</Badge>}
            </>
          }
        />

        <div>
          {product.category && (
            <Link href={routes.category(product.category.slug)} className="text-sm font-semibold uppercase tracking-wide text-muted hover:text-foreground">
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">Артикул: {product.sku}</p>

          <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold">{formatMoney(product.price)}</span>
              <span className="text-muted">за {unit}</span>
              {product.old_price ? <span className="text-lg text-muted line-through">{formatMoney(product.old_price)}</span> : null}
            </div>

            <ul className="mt-4 space-y-1.5 text-sm">
              <li className={product.in_stock ? "flex items-center gap-2 font-semibold text-success" : "flex items-center gap-2 font-semibold text-danger"}>
                {product.in_stock ? <Check className="size-4" /> : <X className="size-4" />}
                {product.in_stock ? `В наличии: ${product.stock} ${unit}` : "Нет в наличии — уточните срок поставки"}
              </li>
              {product.min_order_qty > 1 && (
                <li className="text-muted">
                  Минимальный заказ: {product.min_order_qty} {unit} ({formatMoney(product.price * product.min_order_qty)})
                </li>
              )}
            </ul>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <ButtonLink href={`${routes.login}?next=${encodeURIComponent(routes.product(product.slug))}`} size="lg" className="w-full">
                <ShoppingCart className="size-5" />В корзину
              </ButtonLink>
              {whatsapp ? (
                <a
                  href={`${whatsapp}?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-border px-6 font-semibold transition hover:border-foreground/40"
                >
                  <MessageCircle className="size-5" />
                  Спросить в WhatsApp
                </a>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-muted">Чтобы оформить заказ, войдите или зарегистрируйтесь — это займёт минуту.</p>
          </div>

          <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <li className="flex gap-3 rounded-2xl bg-surface-muted p-4">
              <Truck className="size-5 shrink-0 text-brand" />
              <span>
                <b className="block">Доставка по Душанбе</b>
                {delivery
                  ? `${formatMoney(delivery.price)}, бесплатно от ${formatMoney(delivery.free_from)} — тяжёлые грузы привезём КамАЗом с разгрузкой`
                  : "В день подтверждения заказа, по районам — на следующий день."}
              </span>
            </li>
            <li className="flex gap-3 rounded-2xl bg-surface-muted p-4">
              <Banknote className="size-5 shrink-0 text-brand" />
              <span>
                <b className="block">Оплата до доставки</b>
                Наличными в офисе или переводом на карту. Юрлицам — безнал.{" "}
                <Link href={routes.delivery} className="underline">
                  Подробнее
                </Link>
              </span>
            </li>
          </ul>

          {phone && (
            <a href={`tel:${phone}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:text-brand">
              <Phone className="size-4 text-brand" />
              Нужен расчёт объёма? Звоните: {formatPhone(phone)}
            </a>
          )}
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {product.specs.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold">Характеристики</h2>
            <dl className="mt-4 divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
              <div className="flex justify-between gap-4 px-5 py-3 text-sm">
                <dt className="text-muted">Единица</dt>
                <dd className="text-right font-semibold">{unit}</dd>
              </div>
              {product.specs.map((spec) => (
                <div key={spec.name} className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <dt className="text-muted">{spec.name}</dt>
                  <dd className="text-right font-semibold">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {product.description && (
          <section>
            <h2 className="text-xl font-extrabold">Описание</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/80">{product.description}</p>
          </section>
        )}
      </div>
    </>
  );
}
