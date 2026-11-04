"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { formatMoney } from "@/shared/lib/format";
import { buttonClasses } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/kit/dialog";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";

export type QuickOrderProduct = { slug: string; name: string; price: number; unit: string; image?: string; min_order_qty: number; stock: number };

type Props = { product: QuickOrderProduct; open: boolean; onOpenChange: (open: boolean) => void };

/** How many, and on to the usual checkout with this one product: the cart stays as it was. */
export function QuickOrderDialog({ product, open, onOpenChange }: Props) {
  const { t, locale } = useI18n();
  const min = Math.max(1, product.min_order_qty);
  const [quantity, setQuantity] = useState(min);
  const go = useRef<HTMLAnchorElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // The main action takes the focus: otherwise the number in the stepper opens selected.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          go.current?.focus();
        }}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-3xl border-border bg-surface p-0 shadow-2xl sm:max-w-[26rem]"
      >
        <div className="flex gap-4 p-5 pr-12">
          <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
            {product.image && (
              // eslint-disable-next-line @next/next/no-img-element -- a ready small WebP from the backend
              <img src={product.image} alt="" className="absolute inset-0 size-full object-cover" />
            )}
          </span>
          <div className="min-w-0 self-center">
            <DialogTitle className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Zap className="size-3.5 fill-brand text-brand" />
              {t.cart.quickOrder}
            </DialogTitle>
            <DialogDescription className="mt-1.5 line-clamp-3 text-base font-bold leading-snug text-foreground">{product.name}</DialogDescription>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(product.price, locale)} {fmt(t.common.perUnit, { unit: product.unit })}
            </p>
          </div>
        </div>

        <div className="mx-5 flex items-center justify-between gap-3 rounded-2xl bg-surface-muted p-3">
          <QuantityStepper value={quantity} min={min} max={product.stock} onChange={setQuantity} labels={{ quantity: t.cart.quantity, decrease: t.cart.decrease, increase: t.cart.increase }} className="bg-surface" />
          <span className="min-w-0 text-right">
            <span className="block text-xs text-muted-foreground">{t.checkout.total}</span>
            <b className="block font-display text-xl tabular-nums text-success">{formatMoney(product.price * quantity, locale)}</b>
          </span>
        </div>

        <div className="p-5">
          <Link ref={go} prefetch={false} href={routes.buyNow(product.slug, quantity)} onClick={() => onOpenChange(false)} className={buttonClasses({ size: "lg", className: "group/go w-full" })}>
            {t.cart.quickSubmit}
            <ArrowRight className="size-5 transition-transform duration-200 ease-out group-hover/go:translate-x-1" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t.cart.quickLead}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
