"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, CalendarClock, ExternalLink, ImageOff, ImagePlus, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Banner } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { Switch } from "@/shared/ui/kit/switch";

/** ISO date from the API → value of <input type="datetime-local"> in the browser's time zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** datetime-local value → ISO with the time zone, so the server stores the moment the admin meant. */
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

/**
 * Home page slides: preview, on/off, order with arrows, edit in a dialog (texts, link, schedule, desktop and phone images).
 */
export function BannerManager({ banners }: { banners: Banner[] }) {
  const { t, locale } = useI18n();
  const b = t.admin.banners;
  const router = useRouter();
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const dateTime = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const fail = (error: unknown) => toast.error(error instanceof ApiError ? error.message : t.errors.generic);

  const patch = async (banner: Banner, body: Record<string, unknown>) => {
    setBusy(banner.id);
    try {
      await bff(`/api/proxy/admin/banners/${banner.id}`, { method: "PATCH", body });
      router.refresh();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  };

  /** Swap with the neighbour: renumber the whole list, so equal sort values never block the move. */
  const move = async (index: number, step: -1 | 1) => {
    const ordered = [...banners];
    [ordered[index], ordered[index + step]] = [ordered[index + step], ordered[index]];
    setBusy(banners[index].id);
    try {
      await Promise.all(
        ordered.map((banner, i) => ((i + 1) * 10 !== banner.sort_order ? bff(`/api/proxy/admin/banners/${banner.id}`, { method: "PATCH", body: { sort_order: (i + 1) * 10 } }) : null)),
      );
      router.refresh();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(deleting.id);
    try {
      await bff(`/api/proxy/admin/banners/${deleting.id}`, { method: "DELETE" });
      toast.success(t.admin.common.deleted);
      setDeleting(null);
      router.refresh();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {b.add}
        </Button>
      </div>

      {banners.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-muted-foreground">{b.empty}</p>
      ) : (
        <ul className="space-y-3">
          {banners.map((banner, index) => {
            const scheduled = Boolean(banner.starts_at || banner.ends_at);
            return (
              <li key={banner.id} className={cn("overflow-hidden rounded-2xl border border-border bg-surface sm:flex", !banner.is_active && "opacity-70")}>
                <div className="relative aspect-[16/5] shrink-0 bg-muted sm:aspect-auto sm:w-80">
                  {banner.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.image} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full min-h-24 place-items-center text-muted-foreground">
                      <ImageOff className="size-6" />
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <b className="block">{banner.title}</b>
                      {banner.subtitle && <span className="mt-0.5 block text-sm text-muted-foreground">{banner.subtitle}</span>}
                    </div>
                    <Switch checked={banner.is_active} onCheckedChange={(next) => void patch(banner, { is_active: next })} disabled={busy === banner.id} aria-label={b.isActive} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {banner.link && (
                      <span className="inline-flex items-center gap-1">
                        <ExternalLink className="size-3.5" />
                        {banner.button_text ? `${banner.button_text} → ` : ""}
                        {banner.link}
                      </span>
                    )}
                    {scheduled && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="size-3.5" />
                        {[banner.starts_at && dateTime.format(new Date(banner.starts_at)), banner.ends_at && dateTime.format(new Date(banner.ends_at))].filter(Boolean).join(" — ")}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center gap-1 border-t border-border pt-2">
                    <IconButton label={t.admin.categories.moveUp} disabled={busy !== null || index === 0} onClick={() => void move(index, -1)}>
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton label={t.admin.categories.moveDown} disabled={busy !== null || index === banners.length - 1} onClick={() => void move(index, 1)}>
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <span className="flex-1" />
                    <IconButton label={t.admin.common.edit} onClick={() => setEditing(banner)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label={t.admin.common.delete} danger onClick={() => setDeleting(banner)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-xl">
          {editing !== null && (
            <BannerForm
              key={editing === "new" ? "new" : editing.id}
              banner={editing === "new" ? null : editing}
              nextSort={(banners.at(-1)?.sort_order ?? 0) + 10}
              onSaved={(saved, created) => {
                router.refresh();
                if (created) setEditing(saved);
                else setEditing(null);
              }}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{deleting && fmt(t.admin.common.confirmDelete, { name: deleting.title })}</DialogTitle>
          <DialogDescription>{b.deleteText}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t.admin.common.cancel}
            </Button>
            <Button onClick={() => void remove()} disabled={busy !== null} className="bg-destructive text-white hover:bg-destructive/90">
              {busy !== null && <LoaderCircle className="size-4 animate-spin" />}
              {t.admin.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg text-muted-foreground transition disabled:pointer-events-none disabled:opacity-30",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

type Values = { title: string; subtitle: string; button_text: string; link: string; starts_at: string; ends_at: string; is_active: boolean };

function BannerForm({ banner, nextSort, onSaved, onClose }: { banner: Banner | null; nextSort: number; onSaved: (banner: Banner, created: boolean) => void; onClose: () => void }) {
  const { t } = useI18n();
  const b = t.admin.banners;
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      title: banner?.title ?? "",
      subtitle: banner?.subtitle ?? "",
      button_text: banner?.button_text ?? "",
      link: banner?.link ?? "",
      starts_at: toLocalInput(banner?.starts_at),
      ends_at: toLocalInput(banner?.ends_at),
      is_active: banner?.is_active ?? true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim() || null,
      button_text: values.button_text.trim() || null,
      link: values.link.trim() || null,
      starts_at: fromLocalInput(values.starts_at),
      ends_at: fromLocalInput(values.ends_at),
      is_active: values.is_active,
      ...(banner ? {} : { sort_order: nextSort }),
    };

    try {
      const { data } = banner
        ? await bff<{ data: Banner }>(`/api/proxy/admin/banners/${banner.id}`, { method: "PATCH", body })
        : await bff<{ data: Banner }>("/api/proxy/admin/banners", { body });
      toast.success(t.admin.common.saved);
      onSaved(data, !banner);
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["title", "subtitle", "button_text", "link", "starts_at", "ends_at"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <DialogTitle className="text-xl font-extrabold">{banner ? b.editTitle : b.newTitle}</DialogTitle>
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field label={b.bannerTitle} error={errors.title?.message}>
        {(id, describedBy) => <TextInput id={id} aria-invalid={Boolean(errors.title)} aria-describedby={describedBy} {...register("title", { required: t.admin.common.required })} />}
      </Field>
      <Field label={b.subtitle} error={errors.subtitle?.message}>
        {(id, describedBy) => <TextInput id={id} aria-describedby={describedBy} {...register("subtitle")} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={b.buttonText} error={errors.button_text?.message}>
          {(id, describedBy) => <TextInput id={id} placeholder={b.buttonPlaceholder} aria-describedby={describedBy} {...register("button_text")} />}
        </Field>
        <Field label={b.link} error={errors.link?.message} hint={b.linkHint}>
          {(id, describedBy) => <TextInput id={id} placeholder="/catalog" aria-describedby={describedBy} {...register("link")} />}
        </Field>
        <Field label={b.startsAt} error={errors.starts_at?.message} hint={b.scheduleHint}>
          {(id, describedBy) => <TextInput id={id} type="datetime-local" aria-describedby={describedBy} {...register("starts_at")} />}
        </Field>
        <Field label={b.endsAt} error={errors.ends_at?.message}>
          {(id, describedBy) => <TextInput id={id} type="datetime-local" aria-describedby={describedBy} {...register("ends_at")} />}
        </Field>
      </div>
      <Controller
        control={control}
        name="is_active"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 rounded-xl bg-muted px-4 py-3">
            <b className="text-sm">{b.isActive}</b>
            <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={b.isActive} />
          </label>
        )}
      />

      {banner && (
        <div className="grid gap-4 sm:grid-cols-2">
          <BannerImage banner={banner} variant="desktop" />
          <BannerImage banner={banner} variant="mobile" />
        </div>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t.admin.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          {banner ? t.admin.common.save : t.admin.common.create}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BannerImage({ banner, variant }: { banner: Banner; variant: "desktop" | "mobile" }) {
  const { t } = useI18n();
  const b = t.admin.banners;
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(variant === "desktop" ? banner.image : banner.image_mobile);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    const form = new FormData();
    form.append("image", file);
    form.append("variant", variant);
    setBusy(true);
    try {
      const { data } = await bff<{ data: Banner }>(`/api/proxy/admin/banners/${banner.id}/image`, { body: form });
      setImage(variant === "desktop" ? data.image : data.image_mobile);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold">{variant === "desktop" ? b.image : b.imageMobile}</p>
      <p className="mb-2 text-xs text-muted-foreground">{variant === "desktop" ? b.imageHint : b.imageMobileHint}</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className={cn("relative grid w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition hover:border-primary", variant === "desktop" ? "aspect-[16/5]" : "aspect-square max-w-40")}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : null}
        <span className={cn("relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", image ? "bg-black/60 text-white" : "text-muted-foreground")}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {b.upload}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
