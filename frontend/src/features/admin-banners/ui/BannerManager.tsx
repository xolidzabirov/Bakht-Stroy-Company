"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarClock, Camera, ExternalLink, ImageOff, ImagePlus, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { applyApiErrors, bff } from "@/shared/api/client";
import type { Banner } from "@/shared/api/types";
import { useAdminI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { Button, Field, FormAlert, TextInput } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { Switch } from "@/shared/ui/kit/switch";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

/** ISO date from the API → value of <input type="datetime-local"> in the browser's time zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** datetime-local value → ISO with the time zone, so the server stores the moment the admin meant. */
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

type Placement = "hero" | "promo" | "works";

/** Preview of a slide: the first screen photo (5:4), the photo of work (3:2) or the wide banner picture. */
const previewOf = (banner: Banner) => (banner.placement === "hero" ? (banner.image_hero?.large ?? banner.image) : banner.placement === "works" ? (banner.image_work ?? banner.image) : banner.image);

/**
 * Home page slides of one carousel — the main slider of the first screen ("hero"), the banners strip ("promo")
 * or the photos of work ("works", a grid: several photos go up at once):
 * preview, on/off, order with arrows, edit in a dialog (texts, link, schedule, pictures).
 */
export function BannerManager({ banners, placement }: { banners: Banner[]; placement: Placement }) {
  const hero = placement === "hero";
  const works = placement === "works";
  const { t, locale } = useAdminI18n();
  const b = t.admin.banners;
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
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

  /** Photos of work go up in one go: each one becomes a slide of its own, one that fails leaves nothing behind. */
  const uploadWorks = async (files: File[]) => {
    const fitting = files.filter((file) => file.size <= MAX_IMAGE_SIZE);
    if (fitting.length < files.length) toast.error(b.worksImageHint);
    if (fitting.length === 0) return;

    let sort = banners.at(-1)?.sort_order ?? 0;
    setUploading({ done: 0, total: fitting.length });
    for (const [i, file] of fitting.entries()) {
      sort += 10;
      try {
        const { data } = await bff<{ data: Banner }>("/api/proxy/admin/banners", { body: { title: b.worksDefaultTitle, placement, sort_order: sort, is_active: true } });
        const form = new FormData();
        form.append("image", file);
        form.append("variant", "desktop");
        await bff(`/api/proxy/admin/banners/${data.id}/image`, { body: form }).catch(async (error) => {
          await bff(`/api/proxy/admin/banners/${data.id}`, { method: "DELETE" }).catch(() => undefined);
          throw error;
        });
      } catch (error) {
        fail(error);
      }
      setUploading({ done: i + 1, total: fitting.length });
    }
    setUploading(null);
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        {works ? (
          <>
            <Button onClick={() => picker.current?.click()} disabled={uploading !== null}>
              {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {uploading ? fmt(b.worksUploading, { done: uploading.done, total: uploading.total }) : b.worksAdd}
            </Button>
            <input
              ref={picker}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void uploadWorks(files);
              }}
            />
          </>
        ) : (
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            {hero ? b.heroAdd : b.add}
          </Button>
        )}
      </div>

      {banners.length === 0 ? (
        works ? (
          <button type="button" onClick={() => picker.current?.click()} className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-16 text-center transition hover:border-foreground/30">
            <Camera className="size-8 text-muted-foreground" />
            <span className="mt-3 font-semibold">{b.worksEmpty}</span>
            <span className="mt-1 text-sm text-muted-foreground">{b.worksImageHint}</span>
          </button>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-muted-foreground">{hero ? b.heroEmpty : b.empty}</p>
        )
      ) : works ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {banners.map((banner, index) => (
            <li key={banner.id} className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-opacity", !banner.is_active && "opacity-60")}>
              <div className="relative aspect-[3/2] bg-muted">
                {previewOf(banner) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewOf(banner) ?? undefined} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <ImageOff className="size-6" />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className={cn("line-clamp-2 min-h-10 text-sm", banner.subtitle ? "font-medium" : "text-muted-foreground")}>{banner.subtitle ?? b.worksNoCaption}</p>
                <div className="mt-auto flex flex-wrap items-center gap-0.5 border-t border-border pt-2">
                  <IconButton label={t.admin.categories.moveUp} disabled={busy !== null || index === 0} onClick={() => void move(index, -1)}>
                    <ArrowLeft className="size-4" />
                  </IconButton>
                  <IconButton label={t.admin.categories.moveDown} disabled={busy !== null || index === banners.length - 1} onClick={() => void move(index, 1)}>
                    <ArrowRight className="size-4" />
                  </IconButton>
                  <span className="flex-1" />
                  <Switch checked={banner.is_active} onCheckedChange={(next) => void patch(banner, { is_active: next })} disabled={busy === banner.id} aria-label={b.isActive} className="mr-1" />
                  <IconButton label={t.admin.common.edit} onClick={() => setEditing(banner)}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label={t.admin.common.delete} danger onClick={() => setDeleting(banner)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {banners.map((banner, index) => {
            const scheduled = Boolean(banner.starts_at || banner.ends_at);
            return (
              <li key={banner.id} className={cn("overflow-hidden rounded-2xl border border-border bg-surface sm:flex", !banner.is_active && "opacity-70")}>
                <div className={cn("relative shrink-0 bg-muted", hero ? "aspect-[5/4] sm:w-48" : "aspect-[16/5] sm:aspect-auto sm:w-80")}>
                  {previewOf(banner) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewOf(banner) ?? undefined} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full min-h-24 place-items-center text-muted-foreground">
                      <ImageOff className="size-6" />
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      {hero && banner.subtitle && <span className="mb-1 inline-flex rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-on-brand">{banner.subtitle}</span>}
                      <b className="block">{banner.title}</b>
                      {!hero && banner.subtitle && <span className="mt-0.5 block text-sm text-muted-foreground">{banner.subtitle}</span>}
                      {hero && !banner.image && <span className="mt-1 block text-xs font-medium text-destructive">{b.heroNoImage}</span>}
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
        <DialogContent className="rounded-2xl sm:max-w-xl">
          {editing !== null && (
            <BannerForm
              key={editing === "new" ? "new" : editing.id}
              banner={editing === "new" ? null : editing}
              placement={placement}
              nextSort={(banners.at(-1)?.sort_order ?? 0) + 10}
              onSaved={() => {
                router.refresh();
                setEditing(null);
              }}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogTitle className="text-xl font-extrabold">{deleting && (works ? b.worksDeleteTitle : fmt(t.admin.common.confirmDelete, { name: deleting.title }))}</DialogTitle>
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

function BannerForm({
  banner,
  placement,
  nextSort,
  onSaved,
  onClose,
}: {
  banner: Banner | null;
  placement: Placement;
  nextSort: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { t } = useAdminI18n();
  const b = t.admin.banners;
  const hero = placement === "hero";
  const works = placement === "works";
  const [formError, setFormError] = useState<string | null>(null);
  // Pictures of a banner that is not saved yet: they wait in the browser and go up right after "Создать".
  const [draft, setDraft] = useState<{ desktop: File | null; mobile: File | null }>({ desktop: null, mobile: null });
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
      ...(banner ? {} : { sort_order: nextSort, placement }),
    };

    try {
      const { data } = banner
        ? await bff<{ data: Banner }>(`/api/proxy/admin/banners/${banner.id}`, { method: "PATCH", body })
        : await bff<{ data: Banner }>("/api/proxy/admin/banners", { body });
      for (const variant of ["desktop", "mobile"] as const) {
        const file = draft[variant];
        if (!file) continue;
        const form = new FormData();
        form.append("image", file);
        form.append("variant", variant);
        await bff(`/api/proxy/admin/banners/${data.id}/image`, { body: form }).catch((error) => toast.error(error instanceof ApiError ? error.message : t.errors.generic));
      }
      toast.success(t.admin.common.saved);
      onSaved();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["title", "subtitle", "button_text", "link", "starts_at", "ends_at"], t.errors));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <DialogTitle className="text-xl font-extrabold">{works ? b.worksEdit : hero ? (banner ? b.heroEdit : b.heroNew) : banner ? b.editTitle : b.newTitle}</DialogTitle>
      {formError && <FormAlert>{formError}</FormAlert>}

      {/* On the first screen the label is the yellow badge above the title. */}
      {hero && (
        <Field label={b.heroLabel} error={errors.subtitle?.message}>
          {(id, describedBy) => <TextInput id={id} placeholder={b.heroLabelPlaceholder} maxLength={40} aria-describedby={describedBy} {...register("subtitle")} />}
        </Field>
      )}
      {works && (
        <Field label={b.worksCaption} error={errors.subtitle?.message} hint={b.worksCaptionHint}>
          {(id, describedBy) => <TextInput id={id} placeholder={b.worksCaptionPlaceholder} maxLength={120} aria-describedby={describedBy} {...register("subtitle")} />}
        </Field>
      )}
      {!works && (
      <Field label={b.bannerTitle} error={errors.title?.message}>
        {(id, describedBy) => (
          <TextInput id={id} placeholder={hero ? b.heroTitlePlaceholder : undefined} aria-invalid={Boolean(errors.title)} aria-describedby={describedBy} {...register("title", { required: t.admin.common.required })} />
        )}
      </Field>
      )}
      {!hero && !works && (
        <Field label={b.subtitle} error={errors.subtitle?.message}>
          {(id, describedBy) => <TextInput id={id} aria-describedby={describedBy} {...register("subtitle")} />}
        </Field>
      )}
      {hero && (
        <Field label={b.link} error={errors.link?.message} hint={b.heroLinkHint}>
          {(id, describedBy) => <TextInput id={id} placeholder="/catalog" aria-describedby={describedBy} {...register("link")} />}
        </Field>
      )}
      {!works && (
      <div className="grid gap-4 sm:grid-cols-2">
        {!hero && (
          <Field label={b.buttonText} error={errors.button_text?.message}>
            {(id, describedBy) => <TextInput id={id} placeholder={b.buttonPlaceholder} aria-describedby={describedBy} {...register("button_text")} />}
          </Field>
        )}
        {!hero && (
          <Field label={b.link} error={errors.link?.message} hint={b.linkHint}>
            {(id, describedBy) => <TextInput id={id} placeholder="/catalog" aria-describedby={describedBy} {...register("link")} />}
          </Field>
        )}
        <Field label={b.startsAt} error={errors.starts_at?.message} hint={b.scheduleHint}>
          {(id, describedBy) => <TextInput id={id} type="datetime-local" aria-describedby={describedBy} {...register("starts_at")} />}
        </Field>
        <Field label={b.endsAt} error={errors.ends_at?.message}>
          {(id, describedBy) => <TextInput id={id} type="datetime-local" aria-describedby={describedBy} {...register("ends_at")} />}
        </Field>
      </div>
      )}
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

      {works ? (
        banner && <BannerImage banner={banner} variant="work" />
      ) : hero ? (
        banner ? (
          <BannerImage banner={banner} variant="hero" />
        ) : (
          <BannerImageDraft variant="hero" file={draft.desktop} onChange={(file) => setDraft({ ...draft, desktop: file })} />
        )
      ) : banner ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <BannerImage banner={banner} variant="desktop" />
          <BannerImage banner={banner} variant="mobile" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <BannerImageDraft variant="desktop" file={draft.desktop} onChange={(file) => setDraft({ ...draft, desktop: file })} />
          <BannerImageDraft variant="mobile" file={draft.mobile} onChange={(file) => setDraft({ ...draft, mobile: file })} />
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

/** A picture of a banner that is not saved yet: a preview now, the upload after "Создать". */
function BannerImageDraft({ variant, file, onChange }: { variant: "desktop" | "mobile" | "hero"; file: File | null; onChange: (file: File | null) => void }) {
  const { t } = useAdminI18n();
  const b = t.admin.banners;
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <div>
      <p className="text-sm font-semibold">{variant === "hero" ? b.heroImage : variant === "desktop" ? b.image : b.imageMobile}</p>
      <p className="mb-2 text-xs text-muted-foreground">{variant === "hero" ? b.heroImageHint : variant === "desktop" ? b.imageHint : b.imageMobileHint}</p>
      <div className={cn("relative", variant === "hero" ? "max-w-sm" : variant === "mobile" && "max-w-40")}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn("relative grid w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition hover:border-primary", variant === "hero" ? "aspect-[5/4]" : variant === "desktop" ? "aspect-[16/5]" : "aspect-square")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />}
          <span className={cn("relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", preview ? "bg-black/60 text-white" : "text-muted-foreground")}>
            <ImagePlus className="size-4" />
            {b.upload}
          </span>
        </button>
        {preview && (
          <button type="button" onClick={() => onChange(null)} aria-label={t.admin.common.delete} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-destructive">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked && picked.size > MAX_IMAGE_SIZE) toast.error(variant === "hero" ? b.heroImageHint : b.imageHint);
          else if (picked) onChange(picked);
          event.target.value = "";
        }}
      />
    </div>
  );
}

/** desktop / mobile — the banner pictures; hero — the first screen photo (uploaded as the main picture, cut to 5:4). */
function BannerImage({ banner, variant }: { banner: Banner; variant: "desktop" | "mobile" | "hero" | "work" }) {
  const { t } = useAdminI18n();
  const b = t.admin.banners;
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const pick = (data: Banner) => (variant === "hero" || variant === "work" ? previewOf(data) : variant === "desktop" ? data.image : data.image_mobile);
  const [image, setImage] = useState(pick(banner));
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    const form = new FormData();
    form.append("image", file);
    form.append("variant", variant === "mobile" ? "mobile" : "desktop");
    setBusy(true);
    try {
      const { data } = await bff<{ data: Banner }>(`/api/proxy/admin/banners/${banner.id}/image`, { body: form });
      setImage(pick(data));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold">{variant === "work" ? b.worksImage : variant === "hero" ? b.heroImage : variant === "desktop" ? b.image : b.imageMobile}</p>
      <p className="mb-2 text-xs text-muted-foreground">{variant === "work" ? b.worksImageHint : variant === "hero" ? b.heroImageHint : variant === "desktop" ? b.imageHint : b.imageMobileHint}</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className={cn("relative grid w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition hover:border-primary", variant === "work" ? "aspect-[3/2] max-w-sm" : variant === "hero" ? "aspect-[5/4] max-w-sm" : variant === "desktop" ? "aspect-[16/5]" : "aspect-square max-w-40")}
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
