"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Banknote, ShoppingCart, Trash2, Truck } from "lucide-react";
import { useCart, useClearCart, useRemoveFromCart, useSetCartQuantity } from "@/entities/cart/api/useCart";
import { ApiError } from "@/shared/api/http";
import type { Cart, CartItem } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt, plural } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { formatMoney } from "@/shared/lib/format";
import { Button, ButtonLink } from "@/shared/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Separator } from "@/shared/ui/kit/separator";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";

type Props = {
  initialCart: Cart;
  delivery?: { price: number; free_from: number } | null;
};

/**
 * Cart page body: lines with quantity, problems and removal on the left, the order summary on the right.
 */
export function CartView({ initialCart, delivery }: Props) {
  const { t, locale } = useI18n();
  const { data: cart = initialCart } = useCart({ initialData: initialCart });
  const clear = useClearCart();
  const money = (value: number) => formatMoney(value, locale);

  if (cart.items.length === 0) {
    return (
      <div className="mt-6 grid place-items-center rounded-[var(--radius-card)] border border-dashed border-border px-6 py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-ink text-brand ring-2 ring-brand ring-offset-2 ring-offset-background">
          <ShoppingCart className="size-9" />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold">{t.empty.cartTitle}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{t.empty.cartText}</p>
        <ButtonLink href={routes.catalog} className="mt-6">
          {t.common.toCatalog}
        </ButtonLink>
      </div>
    );
  }

  const deliveryPrice = delivery ? (cart.subtotal >= delivery.free_from ? 0 : delivery.price) : null;
  const leftForFree = delivery && cart.subtotal < delivery.free_from ? delivery.free_from - cart.subtotal : 0;
  const total = cart.subtotal + (deliveryPrice ?? 0);

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {cart.items_count} {plural(locale, cart.items_count, t.common.products)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            disabled={clear.isPending}
            onClick={() => clear.mutate(undefined, { onSuccess: () => toast.success(t.cart.cleared), onError: () => toast.error(t.errors.generic) })}
          >
            <Trash2 className="size-4" />
            {t.cart.clear}
          </Button>
        </div>
        <ul className="divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
          {cart.items.map((item) => (
            <CartLine key={item.id} item={item} />
          ))}
        </ul>
      </section>

      <Card className="sticky top-32 gap-0 rounded-[var(--radius-card)] py-0 shadow-none">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-xl font-extrabold">{t.cart.summary}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{fmt(t.cart.goods, { count: cart.items_count })}</span>
            <span className="font-semibold">{money(cart.subtotal)}</span>
          </div>
          {deliveryPrice !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.cart.delivery}</span>
              <span className={cn("font-semibold", deliveryPrice === 0 && "text-success")}>{deliveryPrice === 0 ? t.cart.deliveryFree : money(deliveryPrice)}</span>
            </div>
          )}
          {leftForFree > 0 && (
            <p className="flex gap-2 rounded-xl bg-brand-soft p-3 text-xs">
              <Truck className="size-4 shrink-0" />
              {fmt(t.cart.freeLeft, { sum: money(leftForFree) })}
            </p>
          )}
          <Separator />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{t.cart.total}</span>
            <span className="font-display text-2xl font-extrabold">{money(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t.cart.totalNote}</p>

          {cart.has_problems && (
            <p className="flex gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {t.cart.hasProblems}
            </p>
          )}

          {cart.can_checkout && !cart.has_problems ? (
            <ButtonLink href={routes.checkout} size="lg" className="w-full">
              {t.cart.checkout}
              <ArrowRight className="size-5" />
            </ButtonLink>
          ) : (
            <Button size="lg" className="w-full" disabled>
              {t.cart.checkout}
            </Button>
          )}
          <ButtonLink href={routes.catalog} variant="ghost" className="w-full">
            {t.cart.continue}
          </ButtonLink>

          <p className="flex gap-2 pt-1 text-xs text-muted-foreground">
            <Banknote className="size-4 shrink-0 text-brand" />
            {t.cart.payNote}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** One line: picture, name, price per unit, quantity (saved after a short pause), line total, removal. */
function CartLine({ item }: { item: CartItem }) {
  const { t, locale } = useI18n();
  const setQuantity = useSetCartQuantity();
  const remove = useRemoveFromCart();
  const [quantity, setLocalQuantity] = useState(item.quantity);
  const product = item.product;
  const unit = product?.unit.label ?? "";

  // Save the typed / clicked quantity 400 ms after the last change; roll back if the server refuses.
  useEffect(() => {
    if (quantity === item.quantity) return;

    const timer = setTimeout(() => {
      setQuantity.mutate(
        { itemId: item.id, quantity },
        {
          onError: (error) => {
            toast.error(error instanceof ApiError ? error.message : t.errors.generic);
            setLocalQuantity(item.quantity);
          },
        },
      );
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when the local quantity changes
  }, [quantity]);

  const problem =
    item.problem && product
      ? fmt(t.cart.problems[item.problem], { stock: product.stock, min: product.min_order_qty, unit })
      : item.problem
        ? t.cart.problems.unavailable
        : null;

  return (
    <li className={cn("flex gap-4 p-4 sm:p-5", item.problem === "unavailable" && "opacity-60")}>
      <Link href={product ? routes.product(product.slug) : routes.catalog} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
        {product?.image && <Image src={product.image.thumb} alt={product.name} fill sizes="96px" className="object-cover" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          {product?.category && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.category.name}</p>}
          {product ? (
            <Link href={routes.product(product.slug)} className="line-clamp-2 font-semibold leading-snug hover:underline">
              {product.name}
            </Link>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMoney(item.price, locale)} {fmt(t.common.perUnit, { unit })}
          </p>
          {problem && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {problem}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {product && item.problem !== "unavailable" && (
            <QuantityStepper
              size="sm"
              value={quantity}
              min={Math.max(1, product.min_order_qty)}
              max={Math.max(product.stock, 1)}
              onChange={setLocalQuantity}
              labels={{ quantity: t.cart.quantity, decrease: t.cart.decrease, increase: t.cart.increase }}
            />
          )}
          <p className="w-28 text-right font-display text-lg font-extrabold tabular-nums">{formatMoney(item.price * quantity, locale)}</p>
          <button
            type="button"
            aria-label={t.cart.remove}
            title={t.cart.remove}
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.id, { onSuccess: () => toast.success(t.cart.removed), onError: () => toast.error(t.errors.generic) })}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
