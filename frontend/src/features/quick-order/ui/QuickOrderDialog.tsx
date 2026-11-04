"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Zap } from "lucide-react";
import { bff } from "@/shared/api/client";
import { ApiError } from "@/shared/api/http";
import { useMe } from "@/shared/api/useMe";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { formatMoney } from "@/shared/lib/format";
import { Button } from "@/shared/ui";
import { Field, TextInput } from "@/shared/ui/Field";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/kit/dialog";
import { PhoneInput } from "@/shared/ui/PhoneInput";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";

export type QuickOrderProduct = { id: number; name: string; price: number; unit: string; image?: string; min_order_qty: number; stock: number };

type Props = { product: QuickOrderProduct; open: boolean; onOpenChange: (open: boolean) => void };

/** The quantity and how to reach the person: the rest the manager settles by phone. */
export function QuickOrderDialog({ product, open, onOpenChange }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { data: me } = useMe();
  const min = Math.max(1, product.min_order_qty);
  const [quantity, setQuantity] = useState(min);
  // Until the person types, the fields follow the profile (it may arrive a moment later).
  const [typedName, setName] = useState<string | null>(null);
  const [typedPhone, setPhone] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  const name = typedName ?? me?.name ?? "";
  const phone = typedPhone ?? (me?.phone?.startsWith("+992") ? me.phone.slice(4) : "");
  const total = formatMoney(product.price * quantity, locale);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = {
      name: name.trim().length < 2 ? t.cart.quickNameError : undefined,
      phone: /^\d{9}$/.test(phone) ? undefined : t.cart.quickPhoneError,
    };
    setErrors(found);
    if (found.name || found.phone) return;

    setPending(true);
    try {
      const response = await bff<{ data: { number: string } }>("/api/proxy/orders/quick", {
        body: { product_id: product.id, quantity, customer_name: name.trim(), customer_phone: `+992${phone}` },
      });
      onOpenChange(false);
      router.push(routes.orderPlaced(response.data.number));
    } catch (error) {
      if (!(error instanceof ApiError)) setErrors({ form: t.errors.generic });
      else if (error.code === "CART_HAS_PROBLEMS") setErrors({ form: t.cart.quickNoStock });
      else setErrors({ name: error.errors?.customer_name?.[0], phone: error.errors?.customer_phone?.[0], form: error.errors ? undefined : error.message });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-md">
        <div className="flex items-center gap-3 border-b border-border p-5 pr-12">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-[#16181d]">
            <Zap className="size-5 fill-brand text-brand" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-display text-xl font-bold">{t.cart.quickOrder}</DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-muted-foreground">{t.cart.quickLead}</DialogDescription>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="grid gap-4 p-5">
          <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
            {product.image && (
              // eslint-disable-next-line @next/next/no-img-element -- a ready small WebP from the backend
              <img src={product.image} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatMoney(product.price, locale)} {fmt(t.common.perUnit, { unit: product.unit })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <QuantityStepper value={quantity} min={min} max={product.stock} onChange={setQuantity} labels={{ quantity: t.cart.quantity, decrease: t.cart.decrease, increase: t.cart.increase }} />
            <span className="font-display text-xl font-bold tabular-nums text-success">{total}</span>
          </div>

          <Field label={t.cart.quickName} error={errors.name}>
            {(id, describedBy) => <TextInput id={id} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy} />}
          </Field>
          <Field label={t.checkout.phone} error={errors.phone}>
            {(id, describedBy) => <PhoneInput id={id} value={phone} onChange={setPhone} placeholder="93 123 45 67" aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy} />}
          </Field>

          {errors.form && <p role="alert" className="text-sm text-destructive">{errors.form}</p>}

          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? <LoaderCircle className="size-5 animate-spin" /> : <Zap className="size-5 fill-current" />}
            {fmt(t.cart.quickSubmit, { total })}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
