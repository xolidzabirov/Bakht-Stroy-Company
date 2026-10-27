"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Banknote, Building2, Check, CreditCard, LoaderCircle, MapPin, PackageCheck, Plus, Store, Truck } from "lucide-react";
import { cartKey } from "@/entities/cart/api/useCart";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Address, Cart, Order } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { formatMoney } from "@/shared/lib/format";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Separator } from "@/shared/ui/kit/separator";
import { PhoneInput } from "@/shared/ui/PhoneInput";

type Props = {
  cart: Cart;
  addresses: Address[];
  user: { name: string; phone: string | null };
  delivery: { price: number; free_from: number; pickup_address: string | null } | null;
  workHours: string | null;
};

const NEW_ADDRESS = "new";

function createSchema(t: Dictionary) {
  const v = t.checkout.validation;

  return z
    .object({
      customer_name: z.string().trim().min(2, v.name).max(100),
      phone: z.string().regex(/^\d{9}$/, v.phone),
      delivery_type: z.enum(["delivery", "pickup"]),
      address_id: z.string(),
      city: z.string().trim().max(100),
      street: z.string().trim().max(200),
      house: z.string().trim().max(20),
      apartment: z.string().trim().max(20),
      address_comment: z.string().trim().max(500),
      save_address: z.boolean(),
      payment_method: z.enum(["cash", "card_transfer", "transfer"]),
      comment: z.string().trim().max(1000),
    })
    .superRefine((data, ctx) => {
      if (data.delivery_type !== "delivery" || data.address_id !== NEW_ADDRESS) return;
      if (data.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: v.city });
      if (!data.street) ctx.addIssue({ code: "custom", path: ["street"], message: v.street });
      if (!data.house) ctx.addIssue({ code: "custom", path: ["house"], message: v.house });
    });
}

type Values = z.infer<ReturnType<typeof createSchema>>;

/**
 * Checkout on one page: contacts → delivery or pickup → payment (always before delivery) → comment,
 * with the order summary on the right. The API makes the order from the cart.
 */
export function CheckoutForm({ cart, addresses, user, delivery, workHours }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createSchema(t), [t]);
  const money = (value: number) => formatMoney(value, locale);
  const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0];

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: user.name,
      phone: user.phone?.startsWith("+992") ? user.phone.slice(4) : "",
      delivery_type: "delivery",
      address_id: defaultAddress ? String(defaultAddress.id) : NEW_ADDRESS,
      city: "Душанбе",
      street: "",
      house: "",
      apartment: "",
      address_comment: "",
      save_address: addresses.length === 0,
      payment_method: "cash",
      comment: "",
    },
  });

  const deliveryType = useWatch({ control, name: "delivery_type" });
  const addressId = useWatch({ control, name: "address_id" });
  const deliveryPrice = deliveryType === "pickup" || !delivery ? 0 : cart.subtotal >= delivery.free_from ? 0 : delivery.price;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const newAddress = values.delivery_type === "delivery" && values.address_id === NEW_ADDRESS;
    const address = {
      city: values.city,
      street: values.street,
      house: values.house,
      apartment: values.apartment || null,
      comment: values.address_comment || null,
    };

    try {
      // A new address the person wants to keep is saved first, then the order uses it.
      let addressId = !newAddress && values.delivery_type === "delivery" ? Number(values.address_id) : null;
      if (newAddress && values.save_address) {
        const saved = await bff<{ data: Address }>("/api/proxy/me/addresses", { body: { ...address, is_default: addresses.length === 0 } });
        addressId = saved.data.id;
      }

      const response = await bff<{ data: Order }>("/api/proxy/orders", {
        body: {
          delivery_type: values.delivery_type,
          payment_method: values.payment_method,
          customer_name: values.customer_name,
          customer_phone: `+992${values.phone}`,
          address_id: addressId,
          address: newAddress && !addressId ? address : null,
          comment: values.comment || null,
        },
      });

      queryClient.setQueryData(cartKey, { items: [], items_count: 0, subtotal: 0, has_problems: false, can_checkout: false });
      router.push(routes.orderPlaced(response.data.number));
    } catch (error) {
      const message = applyApiErrors(error, setError, ["customer_name", "comment"], t.errors);
      if (error instanceof ApiError && error.errors?.customer_phone) setError("phone", { type: "server", message: error.errors.customer_phone[0] });
      setFormError(message ?? (error instanceof ApiError && error.errors ? Object.values(error.errors)[0]?.[0] ?? null : null));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  const payments = [
    { value: "cash" as const, icon: Banknote },
    { value: "card_transfer" as const, icon: CreditCard },
    { value: "transfer" as const, icon: Building2 },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <Section number={1} title={t.checkout.contacts}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.checkout.name} error={errors.customer_name?.message}>
              {(id, describedBy) => (
                <TextInput id={id} autoComplete="name" aria-invalid={Boolean(errors.customer_name)} aria-describedby={describedBy} {...register("customer_name")} />
              )}
            </Field>
            <Field label={t.checkout.phone} error={errors.phone?.message} hint={t.checkout.phoneHint}>
              {(id, describedBy) => (
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <PhoneInput id={id} value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="93 123 45 67" aria-invalid={Boolean(errors.phone)} aria-describedby={describedBy} />
                  )}
                />
              )}
            </Field>
          </div>
        </Section>

        <Section number={2} title={t.checkout.receiving}>
          <Controller
            control={control}
            name="delivery_type"
            render={({ field }) => (
              <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                <Choice active={field.value === "delivery"} onSelect={() => field.onChange("delivery")} icon={Truck} title={t.checkout.delivery} text={t.checkout.deliveryText} aside={delivery ? (cart.subtotal >= delivery.free_from ? t.checkout.free : money(delivery.price)) : undefined} />
                <Choice active={field.value === "pickup"} onSelect={() => field.onChange("pickup")} icon={Store} title={t.checkout.pickup} text={t.checkout.pickupText} aside={t.checkout.free} />
              </div>
            )}
          />

          {deliveryType === "delivery" ? (
            <div className="mt-5 space-y-4">
              {addresses.length > 0 && (
                <Controller
                  control={control}
                  name="address_id"
                  render={({ field }) => (
                    <div>
                      <p className="mb-2 text-sm font-semibold">{t.checkout.savedAddresses}</p>
                      <div role="radiogroup" className="space-y-2">
                        {addresses.map((address) => (
                          <AddressOption key={address.id} active={field.value === String(address.id)} onSelect={() => field.onChange(String(address.id))} title={address.title} text={address.full} />
                        ))}
                        <AddressOption active={field.value === NEW_ADDRESS} onSelect={() => field.onChange(NEW_ADDRESS)} title={t.checkout.newAddress} icon={Plus} />
                      </div>
                    </div>
                  )}
                />
              )}

              {addressId === NEW_ADDRESS && (
                <div className="grid gap-4 rounded-2xl border border-border bg-muted/40 p-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <Field label={t.checkout.city} error={errors.city?.message}>
                      {(id, describedBy) => <TextInput id={id} autoComplete="address-level2" aria-invalid={Boolean(errors.city)} aria-describedby={describedBy} {...register("city")} />}
                    </Field>
                  </div>
                  <div className="sm:col-span-4">
                    <Field label={t.checkout.street} error={errors.street?.message}>
                      {(id, describedBy) => <TextInput id={id} autoComplete="address-line1" aria-invalid={Boolean(errors.street)} aria-describedby={describedBy} {...register("street")} />}
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label={t.checkout.house} error={errors.house?.message}>
                      {(id, describedBy) => <TextInput id={id} aria-invalid={Boolean(errors.house)} aria-describedby={describedBy} {...register("house")} />}
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label={t.checkout.apartment}>{(id) => <TextInput id={id} {...register("apartment")} />}</Field>
                  </div>
                  <div className="sm:col-span-6">
                    <Field label={t.checkout.addressComment}>
                      {(id) => <TextInput id={id} placeholder={t.checkout.addressCommentPlaceholder} {...register("address_comment")} />}
                    </Field>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 text-sm sm:col-span-6">
                    <Controller control={control} name="save_address" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />} />
                    {t.checkout.saveAddress}
                  </label>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-5 flex gap-3 rounded-2xl bg-muted p-4 text-sm">
              <MapPin className="size-5 shrink-0 text-primary" />
              <span>
                <b className="block">{t.checkout.pickupFrom}</b>
                {delivery?.pickup_address ?? "Душанбе, ул. Джабор Расулов"}
                {workHours && <span className="block text-muted-foreground">{workHours}</span>}
              </span>
            </p>
          )}
        </Section>

        <Section number={3} title={t.checkout.payment}>
          <Controller
            control={control}
            name="payment_method"
            render={({ field }) => (
              <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
                {payments.map(({ value, icon }) => (
                  <Choice key={value} active={field.value === value} onSelect={() => field.onChange(value)} icon={icon} title={t.checkout.payments[value].title} text={t.checkout.payments[value].text} vertical />
                ))}
              </div>
            )}
          />
        </Section>

        <Section number={4} title={t.checkout.comment}>
          <textarea
            rows={3}
            placeholder={t.checkout.commentPlaceholder}
            className="w-full rounded-xl border border-input bg-surface px-4 py-3 text-[15px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-[3px] focus:ring-primary/30"
            {...register("comment")}
          />
        </Section>
      </div>

      <div className="space-y-4 lg:sticky lg:top-32">
        <Card className="gap-0 rounded-[var(--radius-card)] py-0 shadow-none">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl font-extrabold">{t.checkout.summary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 pt-4">
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product?.image && <Image src={item.product.image.thumb} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-medium">{item.product?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} × {money(item.price)}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{money(item.total)}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{fmt(t.checkout.items, { count: cart.items_count })}</span>
                <span className="font-semibold">{money(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.checkout.deliveryPrice}</span>
                <span className={cn("font-semibold", deliveryPrice === 0 && "text-success")}>{deliveryPrice === 0 ? t.checkout.free : money(deliveryPrice)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{t.checkout.total}</span>
              <span className="font-display text-2xl font-extrabold">{money(cart.subtotal + deliveryPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.checkout.totalNote}</p>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="size-5 animate-spin" /> : <PackageCheck className="size-5" />}
              {t.checkout.place}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t.checkout.agree}</p>
          </CardContent>
        </Card>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <p className="font-bold">{t.checkout.howItWorks}</p>
          <ol className="mt-3 space-y-3">
            {t.checkout.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </form>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-sm text-brand dark:bg-white dark:text-ink">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({
  active,
  onSelect,
  icon: Icon,
  title,
  text,
  aside,
  vertical = false,
}: {
  active: boolean;
  onSelect: () => void;
  icon: typeof Truck;
  title: string;
  text: string;
  aside?: string;
  vertical?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "relative flex gap-3 rounded-2xl border bg-surface p-4 text-left transition",
        vertical && "flex-col",
        active ? "border-primary ring-[3px] ring-primary/25" : "border-border hover:border-foreground/30",
      )}
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <b>{title}</b>
          {aside && <span className="text-sm font-semibold text-muted-foreground">{aside}</span>}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{text}</span>
      </span>
      {active && <Check className="absolute right-3 top-3 size-4 text-primary" />}
    </button>
  );
}

function AddressOption({ active, onSelect, title, text, icon: Icon = MapPin }: { active: boolean; onSelect: () => void; title: string | null; text?: string; icon?: typeof MapPin }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
        active ? "border-primary bg-brand-soft" : "border-border hover:border-foreground/30",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1">
        {title && <b className="block">{title}</b>}
        {text && <span className="text-muted-foreground">{text}</span>}
      </span>
      <span className={cn("grid size-5 place-items-center rounded-full border-2", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
        {active && <Check className="size-3" />}
      </span>
    </button>
  );
}
