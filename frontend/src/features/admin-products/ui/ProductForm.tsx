"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { LoaderCircle, Plus, X } from "lucide-react";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { AdminProduct } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { Switch } from "@/shared/ui/kit/switch";
import { Textarea } from "@/shared/ui/kit/textarea";
import { type CategoryOption, diramsToSomoni, somoniToDirams } from "../lib/categories";

const UNITS = ["piece", "bag", "kg", "ton", "m", "m2", "m3", "pack", "roll", "sheet"] as const;

type Values = {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  description: string;
  price: string;
  old_price: string;
  unit: string;
  stock: string;
  min_order_qty: string;
  specs: { name: string; value: string }[];
  is_active: boolean;
  is_featured: boolean;
};

const FIELDS = ["name", "slug", "sku", "category_id", "description", "price", "old_price", "unit", "stock", "min_order_qty", "is_active", "is_featured"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="mb-4 text-base font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Create / edit a product. Prices are typed in somoni (75 or 75,50) and sent in dirams.
 * A new product opens its edit page after saving, where photos can be added.
 */
export function ProductForm({ product, categories, aside }: { product?: AdminProduct; categories: CategoryOption[]; aside?: React.ReactNode }) {
  const { t } = useI18n();
  const p = t.admin.product;
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Values>({
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      sku: product?.sku ?? "",
      category_id: product ? String(product.category_id) : "",
      description: product?.description ?? "",
      price: diramsToSomoni(product?.price),
      old_price: diramsToSomoni(product?.old_price),
      unit: product?.unit.value ?? "piece",
      stock: String(product?.stock ?? 0),
      min_order_qty: String(product?.min_order_qty ?? 1),
      specs: product?.specs ?? [],
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
    },
  });
  const specs = useFieldArray({ control, name: "specs" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const price = somoniToDirams(values.price);
    const oldPrice = values.old_price.trim() ? somoniToDirams(values.old_price) : null;

    if (price === null) return setError("price", { message: p.priceInvalid });
    if (values.old_price.trim() && (oldPrice === null || oldPrice <= price)) return setError("old_price", { message: p.oldPriceInvalid });

    const body = {
      name: values.name.trim(),
      ...(values.slug.trim() ? { slug: values.slug.trim().toLowerCase() } : {}),
      sku: values.sku.trim() || null,
      category_id: Number(values.category_id),
      description: values.description.trim() || null,
      price,
      old_price: oldPrice,
      unit: values.unit,
      stock: Number(values.stock || 0),
      min_order_qty: Number(values.min_order_qty || 1),
      specs: values.specs.filter((spec) => spec.name.trim() && spec.value.trim()).map((spec) => ({ name: spec.name.trim(), value: spec.value.trim() })),
      is_active: values.is_active,
      is_featured: values.is_featured,
    };

    try {
      if (product) {
        const { data } = await bff<{ data: AdminProduct }>(`/api/proxy/admin/products/${product.id}`, { method: "PATCH", body });
        reset({ ...values, slug: data.slug });
        toast.success(t.admin.common.saved);
        router.refresh();
      } else {
        const { data } = await bff<{ data: AdminProduct }>("/api/proxy/admin/products", { body });
        toast.success(p.created);
        router.replace(routes.adminProduct(data.id));
      }
    } catch (error) {
      setFormError(applyApiErrors(error, setError, FIELDS, t.errors));
    }
  });

  const numeric = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.target.value = event.target.value.replace(/\D/g, "");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {formError && <FormAlert>{formError}</FormAlert>}

        <Section title={p.main}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={p.name} error={errors.name?.message}>
                {(id, describedBy) => (
                  <TextInput id={id} placeholder={p.namePlaceholder} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy} {...register("name", { required: t.admin.common.required, minLength: { value: 2, message: t.admin.common.required } })} />
                )}
              </Field>
            </div>
            <Field label={p.category} error={errors.category_id?.message}>
              {(id) => (
                <Controller
                  control={control}
                  name="category_id"
                  rules={{ required: t.admin.common.required }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={id} className="h-12 w-full rounded-xl" aria-invalid={Boolean(errors.category_id)}>
                        <SelectValue placeholder={p.chooseCategory} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)} className={category.depth ? "text-muted-foreground" : "font-semibold"}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </Field>
            <Field label={p.sku} error={errors.sku?.message}>
              {(id, describedBy) => <TextInput id={id} placeholder="BS-000123" aria-describedby={describedBy} {...register("sku")} />}
            </Field>
            <div className="sm:col-span-2">
              <Field label={p.slug} error={errors.slug?.message} hint={p.slugHint}>
                {(id, describedBy) => <TextInput id={id} placeholder="tsement-m500-d0-50-kg" aria-describedby={describedBy} {...register("slug")} />}
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={p.description} error={errors.description?.message}>
                {(id, describedBy) => <Textarea id={id} rows={6} placeholder={p.descriptionPlaceholder} aria-describedby={describedBy} className="rounded-xl" {...register("description")} />}
              </Field>
            </div>
          </div>
        </Section>

        <Section title={p.prices}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={p.price} error={errors.price?.message}>
              {(id, describedBy) => <TextInput id={id} inputMode="decimal" placeholder="75" aria-invalid={Boolean(errors.price)} aria-describedby={describedBy} {...register("price", { required: p.priceInvalid })} />}
            </Field>
            <Field label={p.oldPrice} error={errors.old_price?.message} hint={p.oldPriceHint}>
              {(id, describedBy) => <TextInput id={id} inputMode="decimal" placeholder="82" aria-describedby={describedBy} {...register("old_price")} />}
            </Field>
            <Field label={p.unit}>
              {(id) => (
                <Controller
                  control={control}
                  name="unit"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={id} className="h-12 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {p.units[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </Field>
            <Field label={p.stock} error={errors.stock?.message}>
              {(id, describedBy) => <TextInput id={id} inputMode="numeric" aria-describedby={describedBy} {...register("stock", { onChange: numeric })} />}
            </Field>
            <Field label={p.minQty} error={errors.min_order_qty?.message}>
              {(id, describedBy) => <TextInput id={id} inputMode="numeric" aria-describedby={describedBy} {...register("min_order_qty", { onChange: numeric })} />}
            </Field>
          </div>
        </Section>

        <Section title={p.specs}>
          {specs.fields.length > 0 && (
            <ul className="mb-3 space-y-2">
              {specs.fields.map((spec, index) => (
                <li key={spec.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <TextInput placeholder={p.specName} aria-label={p.specName} {...register(`specs.${index}.name`)} />
                  <TextInput placeholder={p.specValue} aria-label={p.specValue} {...register(`specs.${index}.value`)} />
                  <button type="button" onClick={() => specs.remove(index)} aria-label={t.admin.common.delete} className="grid size-12 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => specs.append({ name: "", value: "" })} disabled={specs.fields.length >= 50}>
            <Plus className="size-4" />
            {p.addSpec}
          </Button>
        </Section>
      </div>

      <div className="space-y-4">
        <Section title={p.visibility}>
          {(["is_active", "is_featured"] as const).map((name) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <label className="flex items-start justify-between gap-4 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0">
                  <span>
                    <b className="block text-sm">{name === "is_active" ? p.isActive : p.isFeatured}</b>
                    <span className="text-xs text-muted-foreground">{name === "is_active" ? p.isActiveHint : p.isFeaturedHint}</span>
                  </span>
                  <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={name === "is_active" ? p.isActive : p.isFeatured} />
                </label>
              )}
            />
          ))}
        </Section>

        <div className="sticky top-0 z-10 rounded-2xl border border-border bg-surface p-4">
          <Button type="submit" className="w-full" disabled={isSubmitting || (Boolean(product) && !isDirty)}>
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {product ? t.admin.common.save : t.admin.common.create}
          </Button>
        </div>

        {aside}
      </div>
    </form>
  );
}
