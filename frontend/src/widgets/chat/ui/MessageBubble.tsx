"use client";

import Link from "next/link";
import { Fragment, memo } from "react";
import { AlertCircle, Check, CheckCheck, Clock3, Copy, CornerUpLeft, FileText, MoreVertical, Package, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import type { ChatAttachment, ChatMessage } from "@/entities/chat/model/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { formatMoney } from "@/shared/lib/format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu";
import { chatTime, fileSize, URL_PATTERN } from "../lib/format";

type Props = {
  message: ChatMessage;
  /** Right side, brand colour — the viewer's own side of the conversation. */
  outgoing: boolean;
  /** Author's name above the bubble (staff side shows which manager wrote). */
  author?: string | null;
  canEdit: boolean;
  /** Linked orders open in the account (customer) or in the admin panel (staff). */
  orderHref: (number: string) => string;
  highlighted?: boolean;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onCopy: (message: ChatMessage) => void;
  onOpenImage: (images: ChatAttachment[], index: number) => void;
  onJumpTo: (id: number) => void;
  onRetry: (localKey: string) => void;
  onDiscard: (localKey: string) => void;
};

function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_PATTERN).map((part, index) =>
        index % 2 === 1 ? (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-2">
            {part}
          </a>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * One message: quote, photos (grid), documents, product card, order link, text, time and ticks.
 * Actions (reply, copy, edit, delete) open from the "⋮" button or a right click.
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  outgoing,
  author,
  canEdit,
  orderHref,
  highlighted,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onOpenImage,
  onJumpTo,
  onRetry,
  onDiscard,
}: Props) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const images = message.attachments.filter((a) => a.is_image);
  const files = message.attachments.filter((a) => !a.is_image);
  const isLocal = message.pending !== undefined;
  const onlyImages = images.length > 0 && !message.body && files.length === 0 && !message.reply_to && !message.product && !message.order;

  const meta = (
    <span className={cn("ml-auto inline-flex shrink-0 items-center gap-1 pl-3 text-[11px] leading-none", outgoing ? "text-ink/60" : "text-muted-foreground", onlyImages && "rounded-full bg-black/45 px-2 py-1 text-white")}>
      {message.is_edited && !message.is_deleted && <span>{c.edited}</span>}
      <time dateTime={message.created_at}>{chatTime(message.created_at, locale)}</time>
      {outgoing &&
        (message.pending === "sending" ? (
          <Clock3 className="size-3.5" aria-hidden />
        ) : message.pending === "failed" ? (
          <AlertCircle className="size-3.5 text-destructive" aria-label={c.failed} />
        ) : message.read_at ? (
          <CheckCheck className={cn("size-4", onlyImages ? "text-white" : "text-sky-600 dark:text-sky-700")} aria-label="✓✓" />
        ) : (
          <Check className="size-4" aria-label="✓" />
        ))}
    </span>
  );

  if (message.is_deleted) {
    return (
      <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
        <p className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-border px-3.5 py-2 text-sm italic text-muted-foreground">
          <Trash2 className="size-3.5" />
          {c.deleted}
          <span className="text-[11px] not-italic">{chatTime(message.created_at, locale)}</span>
        </p>
      </div>
    );
  }

  const menu = !isLocal && (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={c.menu}
        className="grid size-7 shrink-0 place-items-center self-center rounded-full text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 max-md:opacity-60"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={outgoing ? "end" : "start"} className="w-48 rounded-xl">
        <DropdownMenuItem onSelect={() => onReply(message)} className="gap-2.5">
          <CornerUpLeft className="size-4" />
          {c.reply}
        </DropdownMenuItem>
        {message.body && (
          <DropdownMenuItem onSelect={() => onCopy(message)} className="gap-2.5">
            <Copy className="size-4" />
            {c.copy}
          </DropdownMenuItem>
        )}
        {canEdit && (
          <>
            <DropdownMenuItem onSelect={() => onEdit(message)} className="gap-2.5">
              <Pencil className="size-4" />
              {c.edit}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onDelete(message)} className="gap-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
              <Trash2 className="size-4" />
              {c.delete}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={cn("group flex items-end gap-1", outgoing ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "relative max-w-[85%] overflow-hidden rounded-2xl text-[15px] leading-relaxed shadow-sm transition sm:max-w-[75%]",
          outgoing ? "rounded-br-md bg-brand text-ink" : "rounded-bl-md border border-border bg-surface text-foreground",
          onlyImages ? "p-1" : "px-3 py-2",
          highlighted && "ring-2 ring-sky-500 ring-offset-2 ring-offset-background",
          message.pending === "sending" && "opacity-80",
        )}
        onDoubleClick={() => !isLocal && onReply(message)}
      >
        {author && <p className={cn("mb-0.5 text-xs font-bold", outgoing ? "text-ink/70" : "text-primary")}>{author}</p>}

        {message.reply_to && (
          <button
            type="button"
            onClick={() => onJumpTo(message.reply_to!.id)}
            className={cn("mb-1.5 block w-full rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs", outgoing ? "border-ink/40 bg-ink/10" : "border-primary bg-muted")}
          >
            <b className="block">{message.reply_to.from_staff ? c.manager : c.client}</b>
            <span className="line-clamp-2 opacity-80">
              {message.reply_to.is_deleted ? c.deleted : message.reply_to.body || (message.reply_to.has_attachments ? `📎 ${c.file}` : "…")}
            </span>
          </button>
        )}

        {images.length > 0 && (
          <div className={cn("grid gap-1", images.length > 1 && "grid-cols-2", !onlyImages && "-mx-1.5 mb-1.5")}>
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => onOpenImage(images, index)}
                className={cn("relative overflow-hidden rounded-xl bg-muted", images.length === 3 && index === 0 && "col-span-2")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.thumb ?? image.url} alt={image.name} loading="lazy" className={cn("w-full object-cover", images.length > 1 ? "aspect-square" : "max-h-80 min-w-40")} />
              </button>
            ))}
          </div>
        )}

        {files.map((file) => (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            download={file.name}
            className={cn("mb-1.5 flex items-center gap-3 rounded-xl p-2 transition", outgoing ? "bg-ink/10 hover:bg-ink/15" : "bg-muted hover:bg-muted/70")}
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", outgoing ? "bg-ink text-brand" : "bg-primary text-primary-foreground")}>
              <FileText className="size-5" />
            </span>
            <span className="min-w-0">
              <b className="block truncate text-sm">{file.name}</b>
              <span className="text-xs opacity-70">{fileSize(file.size, locale)}</span>
            </span>
          </a>
        ))}

        {message.product && (
          <Link href={routes.product(message.product.slug)} className={cn("mb-1.5 flex items-center gap-3 rounded-xl p-2 transition", outgoing ? "bg-ink/10 hover:bg-ink/15" : "bg-muted hover:bg-muted/70")}>
            {message.product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.product.image} alt="" className="size-12 shrink-0 rounded-lg bg-surface object-cover" />
            ) : (
              <span className="size-12 shrink-0 rounded-lg bg-surface" />
            )}
            <span className="min-w-0">
              <b className="line-clamp-2 text-sm leading-snug">{message.product.name}</b>
              <span className="text-xs font-semibold">
                {formatMoney(message.product.price, locale)} / {message.product.unit}
              </span>
            </span>
          </Link>
        )}

        {message.order && (
          <Link href={orderHref(message.order.number)} className={cn("mb-1.5 flex items-center gap-3 rounded-xl p-2 transition", outgoing ? "bg-ink/10 hover:bg-ink/15" : "bg-muted hover:bg-muted/70")}>
            <Package className="size-5 shrink-0" />
            <span className="min-w-0 text-sm">
              <b>
                {c.order} {message.order.number}
              </b>
              <span className="block text-xs opacity-75">
                {message.order.status.label} · {formatMoney(message.order.total, locale)}
              </span>
            </span>
          </Link>
        )}

        {message.body ? (
          <p className="flex flex-wrap items-end whitespace-pre-wrap break-words">
            <span className="min-w-0">
              <Linkified text={message.body} />
            </span>
            {meta}
          </p>
        ) : (
          <div className={cn("flex", onlyImages && "absolute bottom-2.5 right-2.5")}>{meta}</div>
        )}

        {message.pending === "failed" && message.localKey && (
          <div className="mt-1.5 flex gap-1.5 border-t border-ink/15 pt-1.5 text-xs font-semibold">
            <button type="button" onClick={() => onRetry(message.localKey!)} className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-1 hover:bg-ink/20">
              <RotateCcw className="size-3.5" />
              {c.retry}
            </button>
            <button type="button" onClick={() => onDiscard(message.localKey!)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 hover:bg-ink/10">
              <X className="size-3.5" />
              {c.discard}
            </button>
          </div>
        )}
      </div>
      {menu}
    </div>
  );
});
