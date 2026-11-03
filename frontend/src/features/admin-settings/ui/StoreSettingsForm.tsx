"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { get, type Path, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Clock, ExternalLink, MapPin, Phone, Plus, Store, X } from "lucide-react";
import { diramsToSomoni, somoniToDirams } from "@/features/admin-products/lib/categories";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import type { StoreSettings } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useAdminI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { formatMoney, formatPhone } from "@/shared/lib/format";
import { mapLinks } from "@/shared/lib/maps";
import { LogoMark, TextInput } from "@/shared/ui";
import { EditButton, EditFooter, EmptyValue, SettingRow, SettingsList, SettingsSection } from "@/shared/ui/admin/Settings";
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
  warehouses: { name: string; address: string; coords: string }[];
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

/** The sections of the page and their fields (the first one gets the focus when the section opens). */
const SECTIONS = {
  store: ["name", "description", "work_hours"],
  contacts: ["email", "address", "phones", "lat", "lng"],
  warehouses: ["warehouses"],
  socials: ["socials"],
  delivery: ["price", "free_from", "pickup_address", "delivery_note"],
  payment: ["card_number", "card_holder", "bank", "payment_note"],
} as const satisfies Record<string, readonly string[]>;
type Section = keyof typeof SECTIONS;

const sectionOf = (field: string): Section | null =>
  (Object.keys(SECTIONS) as Section[]).find((section) => (SECTIONS[section] as readonly string[]).includes(field.split(".")[0])) ?? null;

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

const toValues = ({ store, delivery, payment }: StoreSettings): Values => ({
  name: store.name,
  description: store.description ?? "",
  email: store.email ?? "",
  address: store.address ?? "",
  work_hours: store.work_hours ?? "",
  phones: store.phones.map((phone) => ({ value: formatPhone(phone) })),
  lat: store.map.lat?.toString() ?? "",
  lng: store.map.lng?.toString() ?? "",
  warehouses: (store.warehouses ?? []).map((item) => ({ name: item.name, address: item.address ?? "", coords: `${item.lat}, ${item.lng}` })),
  socials: Object.fromEntries(SOCIALS.map((key) => [key, store.socials[key] ?? ""])) as Record<Social, string>,
  price: diramsToSomoni(delivery.price),
  free_from: diramsToSomoni(delivery.free_from),
  pickup_address: delivery.pickup_address ?? "",
  delivery_note: delivery.note ?? "",
  card_number: payment.card_number ?? "",
  card_holder: payment.card_holder ?? "",
  bank: payment.bank ?? "",
  payment_note: payment.note ?? "",
});

const nullable = (value: string) => value.trim() || null;
const coordinate = (value: string) => (value.trim() ? Number(value.replace(",", ".")) : null);

/** "38.5737, 68.7738" as Google Maps copies it (a comma as the decimal mark also works). Only points the map can show. */
function parsePoint(value: string): { lat: number; lng: number } | null {
  const match = value.trim().match(/^(-?\d+(?:[.,]\d+)?)[\s,;]+(-?\d+(?:[.,]\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1].replace(",", "."));
  const lng = Number(match[2].replace(",", "."));
  return lat >= 35.2 && lat <= 42.6 && lng >= 64.5 && lng <= 78 ? { lat, lng } : null;
}

/** A social link as people say it: instagram.com/bakht_stroy → @bakht_stroy, wa.me/992907666609 → +992 90 766 66 09. */
function handleOf(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.replace(/^\/+|\/+$/g, "");
    if (hostname === "wa.me" && /^\d+$/.test(path)) return formatPhone(path);
    if (path.startsWith("@")) return path;
    if (path && !path.includes("/")) return `@${path}`;
    return `${hostname.replace(/^www\./, "")}${path ? `/${path}` : ""}`;
  } catch {
    return url;
  }
}

/** 8600123412341234 → 8600 1234 1234 1234 */
const cardGroups = (value: string) => value.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");

/**
 * Contacts, social links, delivery and card details of the shop (administrator only).
 * Everything reads as text; "Изменить" opens one section as a form, Save sends the settings and shows what the server kept.
 * The card on top shows the shop the way customers see it — and changes while you type.
 */
export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const { t, locale } = useAdminI18n();
  const s = t.admin.settings;
  const c = t.admin.common;
  const router = useRouter();
  const [editing, setEditing] = useState<Section | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const focusField = useRef<string | null>(null);
  const previous = useRef<Section | null>(null);
  const editButtons = useRef<Partial<Record<Section, HTMLButtonElement | null>>>({});

  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ defaultValues: toValues(settings) });
  const phones = useFieldArray({ control, name: "phones" });
  const warehouses = useFieldArray({ control, name: "warehouses" });
  const values = useWatch({ control }) as Values;

  // Opening a section puts the cursor in its first field (or the one "Добавить" was pressed for);
  // closing it returns the focus to its "Изменить" button.
  useEffect(() => {
    if (editing) {
      const target = focusField.current ?? (editing === "socials" ? "socials.instagram" : editing === "contacts" ? "email" : editing === "warehouses" ? "warehouses.0.name" : SECTIONS[editing][0]);
      focusField.current = null;
      setFocus(target as Path<Values>);
    } else if (previous.current) {
      editButtons.current[previous.current]?.focus();
    }
    previous.current = editing;
  }, [editing, setFocus]);

  // Unsaved changes: the browser asks before the tab closes or reloads.
  useEffect(() => {
    if (!editing || !isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editing, isDirty]);

  const open = (section: Section, field?: string) => {
    setFormError(null);
    focusField.current = field ?? null;
    setEditing(section);
  };

  const close = () => {
    setFormError(null);
    setEditing(null);
  };

  const cancel = () => {
    reset();
    close();
  };

  const onSubmit = handleSubmit(async (form) => {
    setFormError(null);
    const price = somoniToDirams(form.price || "0");
    const freeFrom = somoniToDirams(form.free_from || "0");
    if (price === null) return setError("price", { message: t.admin.product.priceInvalid });
    if (freeFrom === null) return setError("free_from", { message: t.admin.product.priceInvalid });

    const points: StoreSettings["store"]["warehouses"] = [];
    let invalid = false;
    form.warehouses.forEach((item, index) => {
      const name = item.name.trim();
      // A line left empty is simply not a warehouse.
      if (!name && !item.address.trim() && !item.coords.trim()) return;
      const point = parsePoint(item.coords);
      if (!name) setError(`warehouses.${index}.name`, { message: s.warehouseNameRequired });
      if (!point) setError(`warehouses.${index}.coords`, { message: s.warehouseCoordsInvalid });
      if (!name || !point) invalid = true;
      else points.push({ name, address: nullable(item.address), ...point });
    });
    if (invalid) return;

    const body = {
      store: {
        name: form.name.trim(),
        description: nullable(form.description),
        email: nullable(form.email),
        address: nullable(form.address),
        work_hours: nullable(form.work_hours),
        phones: form.phones.map((phone) => phone.value.replace(/[^\d+]/g, "")).filter(Boolean),
        map: { lat: coordinate(form.lat), lng: coordinate(form.lng) },
        warehouses: points,
        socials: Object.fromEntries(SOCIALS.map((key) => [key, nullable(form.socials[key])])),
      },
      delivery: { price, free_from: freeFrom, pickup_address: nullable(form.pickup_address), note: nullable(form.delivery_note) },
      payment: { card_number: nullable(form.card_number), card_holder: nullable(form.card_holder), bank: nullable(form.bank), note: nullable(form.payment_note) },
    };

    try {
      const { data } = await bff<{ data: StoreSettings }>("/api/proxy/admin/settings", { method: "PUT", body });
      // Show what the server kept (numbers and links come back normalized).
      reset(toValues(data));
      close();
      toast.success(s.saved);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.errors) {
        const elsewhere: string[] = [];
        for (const [field, messages] of Object.entries(error.errors)) {
          const [, index] = field.match(/^store\.phones\.(\d+)$/) ?? [];
          const [, social] = field.match(/^store\.socials\.(\w+)$/) ?? [];
          const [, place, part] = field.match(/^store\.warehouses\.(\d+)\.(\w+)$/) ?? [];
          const target = ERROR_FIELDS[field] ?? (index !== undefined ? `phones.${index}.value` : social ? `socials.${social}` : place !== undefined ? `warehouses.${place}.${part === "name" || part === "address" ? part : "coords"}` : null);
          if (target && sectionOf(target) === editing) setError(target as Path<Values>, { type: "server", message: messages[0] });
          else elsewhere.push(messages[0]);
        }
        if (elsewhere.length === 0) return;
        return setFormError(elsewhere.join(" "));
      }
      setFormError(error instanceof ApiError ? error.message : t.errors.generic);
    }
  });

  /** A text field of the section being edited, with its error under it. */
  const input = (name: Path<Values>, extra: { placeholder?: string; inputMode?: "decimal" | "email" | "url" | "numeric"; type?: string; multiline?: boolean; label?: string } = {}) => {
    const id = `store-${name.replace(".", "-")}`;
    const error = (get(errors, name) as { message?: string } | undefined)?.message;
    const common = { id, placeholder: extra.placeholder, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined, "aria-label": extra.label };
    return {
      id,
      node: (
        <>
          {extra.multiline ? (
            <Textarea rows={3} className="rounded-xl" {...common} {...register(name)} />
          ) : (
            <TextInput type={extra.type} inputMode={extra.inputMode} {...common} {...register(name)} />
          )}
          {error && (
            <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-destructive">
              {error}
            </p>
          )}
        </>
      ),
    };
  };

  /** One row: the value as text, or its input while the section is edited. */
  const row = (section: Section, name: Path<Values>, label: string, shown: React.ReactNode, extra: Parameters<typeof input>[1] = {}) => {
    if (editing === section) {
      const field = input(name, extra);
      return (
        <SettingRow key={name} label={label} htmlFor={field.id}>
          {field.node}
        </SettingRow>
      );
    }
    const raw = get(values, name) as string | undefined;
    return (
      <SettingRow key={name} label={label}>
        {raw?.trim() ? shown : <EmptyValue text={s.notSet} addLabel={s.add} onAdd={editing ? undefined : () => open(section, name)} />}
      </SettingRow>
    );
  };

  const footer = <EditFooter cancelLabel={c.cancel} saveLabel={c.save} onCancel={cancel} saving={isSubmitting} error={formError} />;
  const sectionProps = (section: Section) => ({
    id: `store-${section}`,
    editing: editing === section,
    action: (
      <EditButton
        label={c.edit}
        onClick={() => open(section)}
        disabled={editing !== null}
        disabledReason={s.finishEditing}
        buttonRef={(node) => {
          editButtons.current[section] = node;
        }}
      />
    ),
    footer,
  });

  /** "Добавить" next to the empty phone list: open the contacts with one number line ready. */
  const addPhone = () => {
    if (phones.fields.length === 0) phones.append({ value: "+992 " }, { shouldFocus: false });
    open("contacts", "phones.0.value");
  };

  /** "Добавить" next to the empty list: open the section with one warehouse ready. */
  const addWarehouse = () => {
    if (warehouses.fields.length === 0) warehouses.append({ name: "", address: "", coords: "" }, { shouldFocus: false });
    open("warehouses");
  };

  const money = (somoni: string) => formatMoney(somoniToDirams(somoni || "0") ?? 0, locale);
  const map = mapLinks(values.address, { lat: values.lat ? Number(values.lat.replace(",", ".")) : null, lng: values.lng ? Number(values.lng.replace(",", ".")) : null });
  const socialLabel: Record<Social, string> = { instagram: s.instagram, telegram: s.telegram, telegram_chat: s.telegramChat, whatsapp: s.whatsapp, facebook: s.facebook, youtube: s.youtube };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <StorePreview values={values} title={s.previewTitle} openLabel={s.openSite} />

      <div className="grid items-start gap-5 xl:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-5">
          <SettingsSection title={s.store} description={s.storeText} {...sectionProps("store")}>
            <SettingsList>
              {row("store", "name", s.name, <span className="font-medium">{values.name}</span>)}
              {row("store", "description", s.description, <span className="whitespace-pre-line leading-relaxed">{values.description}</span>, { multiline: true })}
              {row("store", "work_hours", s.workHours, values.work_hours, { placeholder: s.workHoursPlaceholder })}
            </SettingsList>
          </SettingsSection>

          <SettingsSection title={s.contacts} description={s.contactsText} {...sectionProps("contacts")}>
            <SettingsList>
              {row(
                "contacts",
                "email",
                s.email,
                <a href={`mailto:${values.email}`} className="break-all hover:underline">
                  {values.email}
                </a>,
                { type: "email", inputMode: "email", placeholder: "info@bakhtstroy.tj" },
              )}

              {editing === "contacts" ? (
                <SettingRow label={s.phones}>
                  <ul className="space-y-2">
                    {phones.fields.map((phone, index) => {
                      const error = errors.phones?.[index]?.value?.message;
                      return (
                        <li key={phone.id}>
                          <div className="flex gap-2">
                            <TextInput placeholder="+992 90 766 66 09" inputMode="tel" aria-label={`${s.phones} ${index + 1}`} aria-invalid={Boolean(error)} {...register(`phones.${index}.value`)} />
                            <button type="button" onClick={() => phones.remove(index)} aria-label={`${c.delete}: ${s.phones} ${index + 1}`} className="grid size-12 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                              <X className="size-4" />
                            </button>
                          </div>
                          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">{s.phonesHint}</p>
                  {phones.fields.length < 5 && (
                    <button type="button" onClick={() => phones.append({ value: "+992 " })} className="mt-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
                      <Plus className="size-3.5" />
                      {s.addPhone}
                    </button>
                  )}
                </SettingRow>
              ) : (
                <SettingRow label={s.phones}>
                  {values.phones.some((phone) => phone.value.replace(/\D/g, "")) ? (
                    <ul className="space-y-1.5">
                      {values.phones.map((phone, index) => (
                        <li key={`${phone.value}-${index}`} className="flex flex-wrap items-center gap-2">
                          <a href={`tel:+${phone.value.replace(/\D/g, "")}`} className="tabular-nums hover:underline">
                            {phone.value}
                          </a>
                          {index === 0 && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{s.mainPhone}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyValue text={s.notSet} addLabel={s.add} onAdd={editing ? undefined : addPhone} />
                  )}
                </SettingRow>
              )}

              {row("contacts", "address", s.address, values.address, { placeholder: "Душанбе, ул. Джабор Расулов" })}

              {editing === "contacts" ? (
                <SettingRow label={s.map} htmlFor="store-lat">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      {input("lat", { inputMode: "decimal", placeholder: "38.5737", label: s.lat }).node}
                      <span className="mt-1 block text-xs text-muted-foreground">{s.lat}</span>
                    </div>
                    <div>
                      {input("lng", { inputMode: "decimal", placeholder: "68.7738", label: s.lng }).node}
                      <span className="mt-1 block text-xs text-muted-foreground">{s.lng}</span>
                    </div>
                  </div>
                </SettingRow>
              ) : (
                <SettingRow label={s.map}>
                  {values.lat && values.lng ? (
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="tabular-nums">
                        {values.lat}, {values.lng}
                      </span>
                      {map && (
                        <a href={map.route} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
                          {s.openMap}
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </span>
                  ) : (
                    <EmptyValue text={s.notSet} addLabel={s.add} onAdd={editing ? undefined : () => open("contacts", "lat")} />
                  )}
                </SettingRow>
              )}
            </SettingsList>
          </SettingsSection>

          <SettingsSection title={s.warehouses} description={s.warehousesText} {...sectionProps("warehouses")}>
            {editing === "warehouses" ? (
              <div className="space-y-3 pb-3">
                {warehouses.fields.map((item, index) => {
                  const name = input(`warehouses.${index}.name`, { placeholder: s.warehouseNamePlaceholder });
                  const address = input(`warehouses.${index}.address`, { placeholder: "Душанбе, ул. Джабор Расулов" });
                  const coords = input(`warehouses.${index}.coords`, { inputMode: "decimal", placeholder: "38.5737, 68.7738" });
                  return (
                    <fieldset key={item.id} className="space-y-3 rounded-xl border border-border p-3 sm:p-4">
                      <legend className="sr-only">{`${s.warehouseN} ${index + 1}`}</legend>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{`${s.warehouseN} ${index + 1}`}</p>
                        <button type="button" onClick={() => warehouses.remove(index)} aria-label={`${c.delete}: ${s.warehouseN} ${index + 1}`} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                          <X className="size-4" />
                        </button>
                      </div>
                      <div>
                        <label htmlFor={name.id} className="mb-1.5 block text-sm text-muted-foreground">{s.warehouseName}</label>
                        {name.node}
                      </div>
                      <div>
                        <label htmlFor={address.id} className="mb-1.5 block text-sm text-muted-foreground">{s.warehouseAddress}</label>
                        {address.node}
                      </div>
                      <div>
                        <label htmlFor={coords.id} className="mb-1.5 block text-sm text-muted-foreground">{s.warehouseCoords}</label>
                        {coords.node}
                      </div>
                    </fieldset>
                  );
                })}
                <p className="text-xs leading-relaxed text-muted-foreground">{s.warehouseCoordsHint}</p>
                <button type="button" onClick={() => warehouses.append({ name: "", address: "", coords: "" })} className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
                  <Plus className="size-3.5" />
                  {s.addWarehouse}
                </button>
              </div>
            ) : values.warehouses.length > 0 ? (
              <ul className="divide-y divide-border">
                {values.warehouses.map((item, index) => {
                  const route = mapLinks(null, parsePoint(item.coords) ?? undefined)?.route;
                  return (
                    <li key={`${item.name}-${index}`} className="py-3 text-sm">
                      <p className="font-medium">{item.name}</p>
                      {item.address && <p className="mt-0.5 text-muted-foreground">{item.address}</p>}
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                        <span className="tabular-nums">{item.coords}</span>
                        {route && (
                          <a href={route} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                            {s.openMap}
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="pb-3 text-sm">
                <EmptyValue text={s.warehousesEmpty} addLabel={s.addWarehouse} onAdd={editing ? undefined : addWarehouse} />
              </p>
            )}
          </SettingsSection>
        </div>

        <div className="space-y-5">
          <SettingsSection title={s.socials} description={editing === "socials" ? s.socialHint : s.socialsText} {...sectionProps("socials")}>
            <SettingsList>
              {SOCIALS.map((key) =>
                row(
                  "socials",
                  `socials.${key}`,
                  socialLabel[key],
                  <a href={values.socials[key]} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 hover:underline">
                    <span className="truncate">{handleOf(values.socials[key])}</span>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </a>,
                  { type: "url", inputMode: "url", placeholder: "https://" },
                ),
              )}
            </SettingsList>
          </SettingsSection>

          <SettingsSection title={s.delivery} description={s.deliveryText} {...sectionProps("delivery")}>
            <SettingsList>
              {row("delivery", "price", s.deliveryPrice, <span className="font-medium tabular-nums">{money(values.price)}</span>, { inputMode: "decimal", placeholder: "50" })}
              {row(
                "delivery",
                "free_from",
                s.freeFrom,
                <span className="tabular-nums">{somoniToDirams(values.free_from || "0") ? money(values.free_from) : s.freeAlways}</span>,
                { inputMode: "decimal", placeholder: "3000" },
              )}
              {row("delivery", "pickup_address", s.pickupAddress, values.pickup_address)}
              {row("delivery", "delivery_note", s.deliveryNote, <span className="whitespace-pre-line leading-relaxed">{values.delivery_note}</span>, { multiline: true })}
            </SettingsList>
          </SettingsSection>

          <SettingsSection title={s.payment} description={s.paymentText} {...sectionProps("payment")}>
            <SettingsList>
              {row("payment", "card_number", s.cardNumber, <span className="font-medium tabular-nums tracking-wide">{cardGroups(values.card_number)}</span>, { inputMode: "numeric", placeholder: "0000 0000 0000 0000" })}
              {row("payment", "card_holder", s.cardHolder, values.card_holder)}
              {row("payment", "bank", s.bank, values.bank, { placeholder: "Алиф, Эсхата, Душанбе Сити…" })}
              {row("payment", "payment_note", s.paymentNote, <span className="whitespace-pre-line leading-relaxed">{values.payment_note}</span>, { multiline: true })}
            </SettingsList>
          </SettingsSection>
        </div>
      </div>
    </form>
  );
}

/**
 * The shop the way customers meet it — the dark band with the brand stripes of the home page:
 * logo, name, description, main phone, hours and address. Follows the fields while they are typed.
 */
function StorePreview({ values, title, openLabel }: { values: Values; title: string; openLabel: string }) {
  const phone = values.phones.find((item) => item.value.replace(/\D/g, ""))?.value;
  const facts = [
    { icon: Phone, text: phone },
    { icon: Clock, text: values.work_hours },
    { icon: MapPin, text: values.address },
  ].filter((fact) => fact.text?.trim());

  return (
    <section aria-label={title} className="relative overflow-hidden rounded-2xl bg-ink text-white dark:ring-1 dark:ring-white/10">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--brand) 0 2px, transparent 2px 28px)" }} />
      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <LogoMark className="size-14 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/50">{title}</p>
            <p className={cn("mt-0.5 truncate text-xl font-bold tracking-tight sm:text-2xl", !values.name.trim() && "text-white/40")}>{values.name.trim() || "—"}</p>
            {values.description.trim() && <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/65">{values.description}</p>}
          </div>
        </div>
        <Link
          href={routes.contacts}
          target="_blank"
          className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-lg border border-white/15 px-3.5 text-sm font-semibold text-white/85 transition hover:border-brand/60 hover:text-brand lg:self-center"
        >
          <Store className="size-4" />
          {openLabel}
          <ExternalLink className="size-3.5 opacity-70" />
        </Link>
      </div>
      {facts.length > 0 && (
        <ul className="relative flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 px-5 py-3.5 text-sm text-white/80 sm:px-6">
          {facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex min-w-0 items-center gap-2">
              <Icon className="size-4 shrink-0 text-brand" />
              <span className="truncate tabular-nums">{text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
