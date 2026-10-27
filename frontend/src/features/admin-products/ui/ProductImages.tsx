"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import type { Image } from "@/shared/api/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";

const MAX_IMAGES = 10;
const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Product photos: drop or pick several at once, the first one is the main photo, delete one by one. */
export function ProductImages({ productId, images }: { productId: number; images: Image[] }) {
  const { t } = useI18n();
  const p = t.admin.product;
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const room = MAX_IMAGES - images.length;

  const upload = async (files: File[]) => {
    const valid = files.filter((file) => TYPES.includes(file.type) && file.size <= MAX_SIZE);
    if (valid.length < files.length) toast.error(fmt(t.chat.badType, { name: files.find((f) => !valid.includes(f))!.name }));
    const batch = valid.slice(0, room);
    if (batch.length === 0) return;

    const form = new FormData();
    batch.forEach((file) => form.append("images[]", file));
    setUploading(true);
    try {
      await bff(`/api/proxy/admin/products/${productId}/images`, { body: form });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (mediaId: number) => {
    setDeleting(mediaId);
    try {
      await bff(`/api/proxy/admin/products/${productId}/images/${mediaId}`, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-base font-extrabold">{p.photos}</h2>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">{fmt(p.photosHint, { count: MAX_IMAGES })}</p>

      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <li key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.thumb} alt="" className="size-full object-cover" />
              {index === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-brand">{p.mainPhoto}</span>}
              <button
                type="button"
                onClick={() => void remove(image.id)}
                disabled={deleting !== null}
                aria-label={p.deletePhoto}
                className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white opacity-100 transition hover:bg-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                {deleting === image.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {room > 0 && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            void upload(Array.from(event.dataTransfer.files));
          }}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:bg-brand-soft/50 hover:text-foreground",
            over ? "border-primary bg-brand-soft/60" : "border-border",
          )}
        >
          {uploading ? <LoaderCircle className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          {uploading ? p.uploading : p.dropHere}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        multiple
        hidden
        onChange={(event) => {
          void upload(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
    </section>
  );
}
