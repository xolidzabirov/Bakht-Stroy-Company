"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Path, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { LoaderCircle, Plus, X } from "lucide-react";
import { diramsToSomoni, somoniToDirams } from "@/features/admin-products/lib/categories";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import type { StoreSettings } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { formatPhone } from "@/shared/lib/format";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Textarea } from "@/shared/ui/kit/textarea";

const SOCIALS = ["instagram", "telegram", "telegram_chat", "whatsapp", "facebook", "youtube"] as const;
type Social = (typeof SOCIALS)[number];

type Values = {
  name: string;
  description: string;
  email: string;
  address: string;
  work_hours: string;
  phones: { value: string }[];
  lat: string;
  lng: string;
  socials: Record<Social, string>;
  price: string;
  free_from: string;
  pickup_address: string;
  delivery_note: string;
  card_number: string;
  card_holder: string;
  bank: string;
  payment_note: string;
};

/** API field ("store.phones.0", "delivery.price") → form field, so errors land under the right input. */
const ERROR_FIELDS: Record<string, string> = {
  "store.name": "name",
  "store.description": "description",
  "store.email": "email",
  "store.address": "address",
  "store.work_hours": "work_hours",
  "store.map.lat": "lat",
  "store.map.lng": "lng",
  "delivery.price": "price",
  "delivery.free_from": "free_from",
  "delivery.pickup_address": "pickup_address",
  "delivery.note": "delivery_note",
  "payment.card_number": "card_number",
  "payment.card_holder": "card_holder",
  "payment.bank": "bank",
  "payment.note": "payment_note",
};

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-base font-extrabold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

const nullable = (value: string) => value.trim() || null;

/** Contacts, social links, delivery and card details of the shop (administrator only). */
export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const { t } = useI18n();
  const s = t.admin.settings;
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const { store, delivery, payment } = settings;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Values>({
    defaultValues: {
      name: store.name,
      description: store.description ?? "",
      email: store.email ?? "",
      address: store.address ?? "",
      work_hours: store.work_hours ?? "",
      phones: store.phones.map((phone) => ({ value: formatPhone(phone) })),
      lat: store.map.lat?.toString() ?? "",
      lng: store.map.lng?.toString() ?? "",
      socials: Object.fromEntries(SOCIALS.map((key) => [key, store.socials[key] ?? ""])) as Record<Social, string>,
      price: diramsToSomoni(delivery.price),
      free_from: diramsToSomoni(delivery.free_from),
      pickup_address: delivery.pickup_address ?? "",
      delivery_note: delivery.note ?? "",
      card_number: payment.card_number ?? "",
      card_holder: payment.card_holder ?? "",
      bank: payment.bank ?? "",
      payment_note: payment.note ?? "",
    },
  });
  const phones = useFieldArray({ control, name: "phones" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const price = somoniToDirams(values.price || "0");
    const freeFrom = somoniToDirams(values.free_from || "0");
    if (price === null) return setError("price", { message: t.admin.product.priceInvalid });
    if (freeFrom === null) return setError("free_from", { message: t.admin.product.priceInvalid });

    const body = {
      store: {
        name: values.name.trim(),
        description: nullable(values.description),
        email: nullable(values.email),
        address: nullable(values.address),
        work_hours: nullable(values.work_hours),
        phones: values.phones.map((phone) => phone.value.replace(/[^\d+]/g, "")).filter(Boolean),
        map: { lat: values.lat.trim() ? Number(values.lat.replace(",", ".")) : null, lng: values.lng.trim() ? Number(values.lng.replace(",", ".")) : null },
        socials: Object.fromEntries(SOCIALS.map((key) => [key, nullable(values.socials[key])])),
      },
      delivery: { price, free_from: freeFrom, pickup_address: nullable(values.pickup_address), note: nullable(values.delivery_note) },
      payment: { card_number: nullable(values.card_number), card_holder: nullable(values.card_holder), bank: nullable(values.bank), note: nullable(values.payment_note) },
    };

    try {
      await bff("/api/proxy/admin/settings", { method: "PUT", body });
      reset(values);
      toast.success(s.saved);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.errors) {
        let placed = false;
        for (const [field, messages] of Object.entries(error.errors)) {
          const [, index] = field.match(/^store\.phones\.(\d+)$/) ?? [];
          const [, social] = field.match(/^store\.socials\.(\w+)$/) ?? [];
          const target = ERROR_FIELDS[field] ?? (index !== undefined ? `phones.${index}.value` : social ? `socials.${social}` : null);
          if (target) {
            setError(target as Path<Values>, { type: "server", message: messages[0] });
            placed = true;
          }
        }
        if (placed) return;
      }
      setFormError(error instanceof ApiError ? error.message : t.errors.generic);
    }
  });

  const text = (name: keyof Values, label: string, extra: { placeholder?: string; hint?: string; wide?: boolean; inputMode?: "decimal" | "email" } = {}) => {
    const error = (errors as Record<string, { message?: string } | undefined>)[name]?.message;
    return (
      <div className={extra.wide ? "sm:col-span-2" : undefined}>
        <Field label={label} error={error} hint={extra.hint}>
          {(id, describedBy) => <TextInput id={id} placeholder={extra.placeholder} inputMode={extra.inputMode} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...register(name as never)} />}
        </Field>
      </div>
    );
  };

  const area = (name: keyof Values, label: string) => (
    <div className="sm:col-span-2">
      <Field label={label} error={(errors as Record<string, { message?: string } | undefined>)[name]?.message}>
        {(id, describedBy) => <Textarea id={id} rows={3} aria-describedby={describedBy} className="rounded-xl" {...register(name as never)} />}
      </Field>
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <FormAlert>{formError}</FormAlert>}

      <Section title={s.store}>
        {text("name", s.name)}
        {text("email", s.email, { inputMode: "email", placeholder: "info@bakhtstroy.tj" })}
        {text("description", s.description, { wide: true })}
        {text("address", s.address, { wide: true, placeholder: "Душанбе, ул. Джабор Расулов" })}
        {text("work_hours", s.workHours, { wide: true, placeholder: s.workHoursPlaceholder })}

        <div className="sm:col-span-2">
          <p className="text-sm font-semibold">{s.phones}</p>
          <p className="mb-2 text-xs text-muted-foreground">{s.phonesHint}</p>
          <ul className="space-y-2">
            {phones.fields.map((phone, index) => (
              <li key={phone.id} className="flex gap-2">
                <div className="flex-1">
                  <TextInput placeholder="+992 90 766 66 09" inputMode="tel" aria-label={`${s.phones} ${index + 1}`} aria-invalid={Boolean(errors.phones?.[index]?.value)} {...register(`phones.${index}.value`)} />
                  {errors.phones?.[index]?.value?.message && <p className="mt-1 text-xs text-destructive">{errors.phones[index]!.value!.message}</p>}
                </div>
                <button type="button" onClick={() => phones.remove(index)} aria-label={t.admin.common.delete} className="grid size-12 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {phones.fields.length < 5 && (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => phones.append({ value: "+992 " })}>
              <Plus className="size-4" />
              {s.addPhone}
            </Button>
          )}
        </div>

        <p className="text-sm font-semibold sm:col-span-2">{s.map}</p>
        {text("lat", s.lat, { inputMode: "decimal", placeholder: "38.5737" })}
        {text("lng", s.lng, { inputMode: "decimal", placeholder: "68.7738" })}
      </Section>

      <Section title={s.socials} hint={s.socialHint}>
        {SOCIALS.map((key) => {
          const error = errors.socials?.[key]?.message;
          const label = { instagram: s.instagram, telegram: s.telegram, telegram_chat: s.telegramChat, whatsapp: s.whatsapp, facebook: s.facebook, youtube: s.youtube }[key];
          return (
            <Field key={key} label={label} error={error}>
              {(id, describedBy) => <TextInput id={id} type="url" placeholder="https://" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...register(`socials.${key}`)} />}
            </Field>
          );
        })}
      </Section>

      <Section title={s.delivery}>
        {text("price", s.deliveryPrice, { inputMode: "decimal", placeholder: "50" })}
        {text("free_from", s.freeFrom, { inputMode: "decimal", placeholder: "3000" })}
        {text("pickup_address", s.pickupAddress, { wide: true })}
        {area("delivery_note", s.deliveryNote)}
      </Section>

      <Section title={s.payment}>
        {text("card_number", s.cardNumber, { placeholder: "0000 0000 0000 0000" })}
        {text("card_holder", s.cardHolder)}
        {text("bank", s.bank, { placeholder: "Алиф, Эсхата, Душанбе Сити…" })}
        {area("payment_note", s.paymentNote)}
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full sm:w-auto">
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          {t.admin.common.save}
        </Button>
      </div>

      {/* Only while something is changed: a floating bar to save or drop the changes from anywhere on the page. */}
      {isDirty && (
        <div
          role="status"
          className="sticky bottom-3 z-20 mx-auto flex w-full max-w-2xl animate-in flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl shadow-black/25 fade-in-0 slide-in-from-bottom-4 duration-300 dark:bg-white dark:text-ink"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden className="size-2 rounded-full bg-brand" />
            {t.admin.common.unsaved}
          </span>
          <span className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => reset()} disabled={isSubmitting} className="text-white hover:bg-white/10 hover:text-white dark:text-ink dark:hover:bg-ink/10 dark:hover:text-ink">
              {t.admin.common.cancel}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
              {t.admin.common.save}
            </Button>
          </span>
        </div>
      )}
    </form>
  );
}
