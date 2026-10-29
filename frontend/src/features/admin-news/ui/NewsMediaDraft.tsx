"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2, X } from "lucide-react";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";

export type DraftMedia = { cover: File | null; gallery: File[] };

const MAX_GALLERY = 20;
const MAX_SIZE = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Local previews of picked files; the browser memory is freed when they change. */
function usePreviews(files: File[]) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);
  return urls;
}

/**
 * Cover and gallery for a post that is not saved yet: the photos wait in the browser
 * and are uploaded right after "Создать" (NewsForm), so a new post is made in one go.
 */
export function NewsMediaDraft({ value, onChange }: { value: DraftMedia; onChange: (value: DraftMedia) => void }) {
  const { t } = useI18n();
  const n = t.admin.news;
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const coverFiles = useMemo(() => (value.cover ? [value.cover] : []), [value.cover]);
  const [coverUrl] = usePreviews(coverFiles);
  const galleryUrls = usePreviews(value.gallery);

  const valid = (files: File[]) => {
    const ok = files.filter((file) => TYPES.includes(file.type) && file.size <= MAX_SIZE);
    if (ok.length < files.length) toast.error(fmt(t.chat.badType, { name: files.find((file) => !ok.includes(file))!.name }));
    return ok;
  };

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-extrabold">{n.cover}</h2>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{n.coverHint}</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition hover:border-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />}
            <span className={coverUrl ? "relative inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white" : "inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"}>
              <ImagePlus className="size-4" />
              {t.admin.banners.upload}
            </span>
          </button>
          {coverUrl && (
            <button
              type="button"
              onClick={() => onChange({ ...value, cover: null })}
              aria-label={t.admin.common.delete}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <input
          ref={coverInput}
          type="file"
          accept={TYPES.join(",")}
          hidden
          onChange={(event) => {
            const [file] = valid(Array.from(event.target.files ?? []));
            if (file) onChange({ ...value, cover: file });
            event.target.value = "";
          }}
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-extrabold">{n.gallery}</h2>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{fmt(n.galleryHint, { count: MAX_GALLERY })}</p>
        {galleryUrls.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2">
            {galleryUrls.map((url, index) => (
              <li key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => onChange({ ...value, gallery: value.gallery.filter((_, i) => i !== index) })}
                  aria-label={t.admin.product.deletePhoto}
                  className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {value.gallery.length < MAX_GALLERY && (
          <button
            type="button"
            onClick={() => galleryInput.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              onChange({ ...value, gallery: [...value.gallery, ...valid(Array.from(event.dataTransfer.files))].slice(0, MAX_GALLERY) });
            }}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-5 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            <ImagePlus className="size-6" />
            {t.admin.product.dropHere}
          </button>
        )}
        <input
          ref={galleryInput}
          type="file"
          accept={TYPES.join(",")}
          multiple
          hidden
          onChange={(event) => {
            onChange({ ...value, gallery: [...value.gallery, ...valid(Array.from(event.target.files ?? []))].slice(0, MAX_GALLERY) });
            event.target.value = "";
          }}
        />
      </section>
    </>
  );
}
