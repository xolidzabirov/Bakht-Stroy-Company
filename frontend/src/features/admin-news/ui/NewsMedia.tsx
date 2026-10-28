"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, LoaderCircle, Trash2, X } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import type { Image } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";

const MAX_GALLERY = 20;
const MAX_SIZE = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function useUpload() {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, request: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await request();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(null);
    }
  };

  const valid = (files: File[]) => {
    const ok = files.filter((file) => TYPES.includes(file.type) && file.size <= MAX_SIZE);
    if (ok.length < files.length) toast.error(fmt(t.chat.badType, { name: files.find((file) => !ok.includes(file))!.name }));
    return ok;
  };

  return { busy, run, valid };
}

/** Cover of the post (one picture) and the gallery under the text (up to 20). */
export function NewsMedia({ newsId, cover, gallery }: { newsId: number; cover: Image | null; gallery: Image[] }) {
  const { t } = useI18n();
  const n = t.admin.news;
  const { busy, run, valid } = useUpload();
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const room = MAX_GALLERY - gallery.length;

  const uploadCover = (file: File) => {
    const form = new FormData();
    form.append("image", file);
    void run("cover", () => bff(`/api/proxy/admin/news/${newsId}/cover`, { body: form }));
  };

  const uploadGallery = (files: File[]) => {
    const batch = valid(files).slice(0, room);
    if (batch.length === 0) return;
    const form = new FormData();
    batch.forEach((file) => form.append("images[]", file));
    void run("gallery", () => bff(`/api/proxy/admin/news/${newsId}/gallery`, { body: form }));
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
            disabled={busy !== null}
            className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition hover:border-primary"
          >
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.card} alt="" className="absolute inset-0 size-full object-cover" />
            )}
            <span className={cover ? "relative inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white" : "inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"}>
              {busy === "cover" ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {t.admin.banners.upload}
            </span>
          </button>
          {cover && (
            <button
              type="button"
              onClick={() => void run("cover-delete", () => bff(`/api/proxy/admin/news/${newsId}/cover`, { method: "DELETE" }))}
              disabled={busy !== null}
              aria-label={t.admin.common.delete}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"
            >
              {busy === "cover-delete" ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />}
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
            if (file) uploadCover(file);
            event.target.value = "";
          }}
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-extrabold">{n.gallery}</h2>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{fmt(n.galleryHint, { count: MAX_GALLERY })}</p>
        {gallery.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2">
            {gallery.map((image) => (
              <li key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.thumb} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => void run(`g-${image.id}`, () => bff(`/api/proxy/admin/news/${newsId}/gallery/${image.id}`, { method: "DELETE" }))}
                  disabled={busy !== null}
                  aria-label={t.admin.product.deletePhoto}
                  className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  {busy === `g-${image.id}` ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
        {room > 0 && (
          <button
            type="button"
            onClick={() => galleryInput.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              uploadGallery(Array.from(event.dataTransfer.files));
            }}
            disabled={busy !== null}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-5 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            {busy === "gallery" ? <LoaderCircle className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            {busy === "gallery" ? t.admin.product.uploading : t.admin.product.dropHere}
          </button>
        )}
        <input
          ref={galleryInput}
          type="file"
          accept={TYPES.join(",")}
          multiple
          hidden
          onChange={(event) => {
            uploadGallery(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </section>
    </>
  );
}
