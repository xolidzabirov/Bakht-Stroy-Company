"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { useAdminI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";

export const MAX_PRODUCT_PHOTOS = 10;
const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Photos for a product that is not saved yet: they wait in the browser and are uploaded
 * right after "Создать" (ProductForm), so a new product is made in one go. The first one is the main photo.
 */
export function ProductPhotosDraft({ value, onChange }: { value: File[]; onChange: (files: File[]) => void }) {
  const { t } = useAdminI18n();
  const p = t.admin.product;
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const urls = useMemo(() => value.map((file) => URL.createObjectURL(file)), [value]);
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);

  const add = (files: File[]) => {
    const ok = files.filter((file) => TYPES.includes(file.type) && file.size <= MAX_SIZE);
    if (ok.length < files.length) toast.error(fmt(t.chat.badType, { name: files.find((file) => !ok.includes(file))!.name }));
    onChange([...value, ...ok].slice(0, MAX_PRODUCT_PHOTOS));
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-base font-extrabold">{p.photos}</h2>
      <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{fmt(p.photosHint, { count: MAX_PRODUCT_PHOTOS })}</p>

      {urls.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2">
          {urls.map((url, index) => (
            <li key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              {index === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-brand">{p.mainPhoto}</span>}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={p.deletePhoto}
                className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length < MAX_PRODUCT_PHOTOS && (
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
            add(Array.from(event.dataTransfer.files));
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground",
            over ? "border-primary bg-brand-soft text-foreground" : "border-border",
          )}
        >
          <ImagePlus className="size-6" />
          {p.dropHere}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        multiple
        hidden
        onChange={(event) => {
          add(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
    </section>
  );
}
