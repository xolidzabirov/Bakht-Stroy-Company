"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LoaderCircle, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Address } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";

type FormValues = { title: string; city: string; street: string; house: string; apartment: string; comment: string };

/**
 * Saved delivery addresses: cards with "default", edit in a dialog, delete with a confirmation.
 */
export function AddressManager({ addresses }: { addresses: Address[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const a = t.acc.addresses;

  const act = async (id: number, request: () => Promise<unknown>, message?: string) => {
    setBusy(id);
    try {
      await request();
      if (message) toast.success(message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{a.title}</h1>
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {a.add}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <MapPin className="size-10 text-muted-foreground" />
          <p className="mt-4 font-bold">{a.empty}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{a.emptyText}</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className={cn("flex flex-col rounded-2xl border bg-surface p-5", address.is_default ? "border-primary ring-2 ring-primary/20" : "border-border")}>
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft">
                  <MapPin className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <b>{address.title || address.city}</b>
                    {address.is_default && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{a.default}</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{address.full}</span>
                  {address.comment && <span className="mt-1 block text-xs text-muted-foreground">{address.comment}</span>}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {!address.is_default && (
                  <Button variant="ghost" size="sm" disabled={busy === address.id} onClick={() => act(address.id, () => bff(`/api/proxy/me/addresses/${address.id}/default`))}>
                    <Star className="size-4" />
                    {a.makeDefault}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setEditing(address)}>
                  <Pencil className="size-4" />
                  {a.edit}
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={() => setDeleting(address)}>
                  <Trash2 className="size-4" />
                  {a.delete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          {editing !== null && (
            <AddressForm
              address={editing === "new" ? null : editing}
              isFirst={addresses.length === 0}
              onDone={() => {
                setEditing(null);
                toast.success(a.saved);
                router.refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{a.deleteTitle}</DialogTitle>
          <DialogDescription>{deleting?.full}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {a.cancel}
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={busy === deleting?.id}
              onClick={() =>
                deleting &&
                act(deleting.id, () => bff(`/api/proxy/me/addresses/${deleting.id}`, { method: "DELETE" }), a.deleted).then(() => setDeleting(null))
              }
            >
              {busy === deleting?.id && <LoaderCircle className="size-4 animate-spin" />}
              {a.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddressForm({ address, isFirst, onDone, onCancel }: { address: Address | null; isFirst: boolean; onDone: () => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const a = t.acc.addresses;
  const c = t.checkout;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: address?.title ?? "",
      city: address?.city ?? "Душанбе",
      street: address?.street ?? "",
      house: address?.house ?? "",
      apartment: address?.apartment ?? "",
      comment: address?.comment ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      title: values.title || null,
      city: values.city,
      street: values.street,
      house: values.house,
      apartment: values.apartment || null,
      comment: values.comment || null,
      ...(address ? {} : { is_default: isFirst }),
    };

    try {
      await bff(address ? `/api/proxy/me/addresses/${address.id}` : "/api/proxy/me/addresses", { method: address ? "PATCH" : "POST", body });
      onDone();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["title", "city", "street", "house", "apartment", "comment"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <DialogTitle className="text-xl font-extrabold">{address ? a.edit : a.new}</DialogTitle>
      {formError && <FormAlert>{formError}</FormAlert>}
      <Field label={a.name}>{(id) => <TextInput id={id} placeholder={a.namePlaceholder} {...register("title")} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={c.city} error={errors.city?.message}>
          {(id, describedBy) => <TextInput id={id} aria-invalid={Boolean(errors.city)} aria-describedby={describedBy} {...register("city", { required: c.validation.city })} />}
        </Field>
        <Field label={c.street} error={errors.street?.message}>
          {(id, describedBy) => <TextInput id={id} aria-invalid={Boolean(errors.street)} aria-describedby={describedBy} {...register("street", { required: c.validation.street })} />}
        </Field>
        <Field label={c.house} error={errors.house?.message}>
          {(id, describedBy) => <TextInput id={id} aria-invalid={Boolean(errors.house)} aria-describedby={describedBy} {...register("house", { required: c.validation.house })} />}
        </Field>
        <Field label={c.apartment}>{(id) => <TextInput id={id} {...register("apartment")} />}</Field>
      </div>
      <Field label={c.addressComment}>{(id) => <TextInput id={id} placeholder={c.addressCommentPlaceholder} {...register("comment")} />}</Field>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {a.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          {a.save}
        </Button>
      </DialogFooter>
    </form>
  );
}
