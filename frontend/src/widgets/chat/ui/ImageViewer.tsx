"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import type { ChatAttachment } from "@/entities/chat/model/types";
import { useI18n } from "@/shared/i18n/client";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/kit/dialog";

/** Photos from a message on a dark full-screen backdrop: arrows / keyboard to flip, download the original. */
export function ImageViewer({ images, index, onIndex, onClose }: { images: ChatAttachment[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const { t } = useI18n();
  const image = images[index];
  const go = (step: number) => onIndex((index + step + images.length) % images.length);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (images.length < 2) return;
      if (event.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (event.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, index, onIndex]);

  if (!image) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="grid h-dvh max-h-dvh w-screen max-w-none place-items-center rounded-none border-0 bg-black/95 p-0 sm:max-w-none">
        <DialogTitle className="sr-only">{image.name}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={image.name} className="max-h-[88dvh] max-w-[94vw] select-none object-contain" />

        <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent p-3 text-white">
          <span className="min-w-0 flex-1 truncate text-sm">
            {image.name}
            {images.length > 1 && <span className="ml-2 opacity-70">{`${index + 1} / ${images.length}`}</span>}
          </span>
          <a href={image.url} download={image.name} target="_blank" rel="noopener noreferrer" aria-label={t.chat.file} className="grid size-10 place-items-center rounded-full hover:bg-white/15">
            <Download className="size-5" />
          </a>
          <button type="button" onClick={onClose} aria-label={t.chat.close} className="grid size-10 place-items-center rounded-full hover:bg-white/15">
            <X className="size-5" />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="←" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="→" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
