"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ImagePlus, LoaderCircle, MessagesSquare, WifiOff } from "lucide-react";
import type { ChatThread } from "@/entities/chat/api/useChatThread";
import type { ChatProductDraft } from "@/entities/chat/model/panel";
import type { ChatAttachment, ChatMessage, ChatViewer } from "@/entities/chat/model/types";
import { ApiError } from "@/shared/api/http";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/shared/ui/kit/dialog";
import { dayLabel, sameDay } from "../lib/format";
import { acceptFiles, Composer, type ComposerLimits } from "./Composer";
import { ImageViewer } from "@/shared/ui/ImageViewer";
import { MessageBubble } from "./MessageBubble";

type Props = {
  thread: ChatThread;
  viewer: ChatViewer;
  /** Staff: own user id — only own replies can be edited; colleagues' replies are on the same side. */
  myId?: number;
  myName: string;
  limits: ComposerLimits;
  orderHref: (number: string) => string;
  suggestions?: readonly string[];
  empty?: React.ReactNode;
  autoFocus?: boolean;
  className?: string;
  product?: ChatProductDraft | null;
  onClearProduct?: () => void;
};

const NEAR_BOTTOM = 120;

/**
 * The conversation itself, shared by the customer's chat and the manager's inbox:
 * messages grouped by day, "new messages" marker, older history on scroll up, auto-scroll for new ones,
 * "typing…", drag & drop files, and the composer.
 */
export function ChatThreadView({ thread, viewer, myId, myName, limits, orderHref, suggestions, empty, autoFocus, className, product, onClearProduct }: Props) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const scroller = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [deleting, setDeleting] = useState<ChatMessage | null>(null);
  const [viewerImages, setViewerImages] = useState<{ images: ChatAttachment[]; index: number } | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  /** Newest message id the reader has scrolled down to; incoming ones after it are counted on the "↓" button. */
  const [seenUpTo, setSeenUpTo] = useState(0);
  const { messages, typing } = thread;
  const newestId = messages.reduce((max, m) => Math.max(max, m.id), 0);
  const unseen = atBottom ? 0 : messages.filter((m) => m.id > seenUpTo && thread.isIncoming(m)).length;

  const outgoing = useCallback((m: ChatMessage) => !thread.isIncoming(m), [thread]);
  const canEdit = (m: ChatMessage) => m.id > 0 && !m.is_deleted && (viewer === "client" ? !m.from_staff : m.sender?.id === myId);

  /* ---------- "new messages" marker: fixed at first load ---------- */

  const [firstUnreadId, setFirstUnreadId] = useState<number | null | undefined>(undefined);
  if (firstUnreadId === undefined && !thread.isLoading) {
    const first = messages.find((m) => m.id > 0 && thread.isIncoming(m) && !m.read_at && !m.is_deleted)?.id ?? null;
    setFirstUnreadId(first);
    setSeenUpTo(first ? first - 1 : newestId);
  }

  /* ---------- scrolling ---------- */

  const nearBottom = () => {
    const el = scroller.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
  };

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // First paint: jump to the first unread message or to the end.
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (placed.current || firstUnreadId === undefined || !scroller.current) return;
    placed.current = true;
    const marker = firstUnreadId ? scroller.current.querySelector(`[data-id="${firstUnreadId}"]`) : null;
    if (marker) marker.scrollIntoView({ block: "center" });
    else scrollToBottom();
  }, [firstUnreadId, scrollToBottom]);

  // New messages at the end: follow them if the reader is at the bottom or it is their own message.
  const lastKey = messages.at(-1)?.localKey ?? messages.at(-1)?.id;
  const previousLast = useRef(lastKey);
  const wasNearBottom = useRef(true);
  useLayoutEffect(() => {
    if (!placed.current || lastKey === previousLast.current) return;
    const last = messages.at(-1);
    previousLast.current = lastKey;
    if (!last) return;
    if (wasNearBottom.current || outgoing(last)) scrollToBottom(true);
  }, [lastKey, messages, outgoing, scrollToBottom]);

  // Older history: keep the same message under the reader's eyes after loading.
  const heightBeforeOlder = useRef<number | null>(null);
  const firstId = messages[0]?.id;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && heightBeforeOlder.current !== null) {
      el.scrollTop += el.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
    }
  }, [firstId]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    wasNearBottom.current = nearBottom();
    setAtBottom(wasNearBottom.current);
    if (wasNearBottom.current && seenUpTo !== newestId) setSeenUpTo(newestId);
    if (el.scrollTop < 80 && thread.hasOlder && !thread.loadingOlder) {
      heightBeforeOlder.current = el.scrollHeight;
      void thread.loadOlder();
    }
  };

  // The "typing…" line should not push the last message out of view.
  useEffect(() => {
    if (typing && wasNearBottom.current) scrollToBottom(true);
  }, [typing, scrollToBottom]);

  /* ---------- actions ---------- */

  const jumpTo = useCallback((id: number) => {
    const target = scroller.current?.querySelector(`[data-id="${id}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlight(id);
    setTimeout(() => setHighlight(null), 1600);
  }, []);

  const copy = useCallback(
    (m: ChatMessage) => {
      void navigator.clipboard?.writeText(m.body ?? "").then(() => toast.success(c.copied));
    },
    [c.copied],
  );

  const startReply = useCallback((m: ChatMessage) => {
    setEditing(null);
    setReplyTo(m);
  }, []);

  const startEdit = useCallback((m: ChatMessage) => {
    setReplyTo(null);
    setEditing(m);
  }, []);

  const send = (text: string) => {
    thread.send({ body: text, files, replyTo, productId: product?.id });
    setFiles([]);
    if (product) onClearProduct?.();
    setReplyTo(null);
    wasNearBottom.current = true;
  };

  const saveEdit = async (m: ChatMessage, text: string) => {
    try {
      await thread.edit(m.id, text);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await thread.remove(deleting.id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    }
    setDeleting(null);
  };

  const openImage = useCallback((images: ChatAttachment[], index: number) => setViewerImages({ images, index }), []);

  /* ---------- render ---------- */

  return (
    <div
      className={cn("relative flex min-h-0 flex-col bg-background", className)}
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!editing) setFiles((current) => acceptFiles(current, Array.from(event.dataTransfer.files), limits, c));
      }}
    >
      {!thread.connected && !thread.isLoading && (
        <p className="flex items-center justify-center gap-1.5 bg-muted px-3 py-1 text-center text-[11px] text-muted-foreground">
          <WifiOff className="size-3" />
          {c.offline}
        </p>
      )}

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5" role="log" aria-live="polite">
        {thread.isLoading ? (
          <div className="grid h-full place-items-center">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : thread.isError && messages.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">{c.error}</p>
        ) : messages.length === 0 ? (
          (empty ?? (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft">
                  <MessagesSquare className="size-7" />
                </span>
                <p className="mt-4 font-bold">{c.empty}</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{c.emptyText}</p>
              </div>
            </div>
          ))
        ) : (
          <>
            {thread.loadingOlder && (
              <div className="flex justify-center py-2">
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!thread.hasOlder && <div className="h-2" />}
            <ol className="space-y-1.5">
              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const newDay = !previous || !sameDay(previous.created_at, message.created_at);
                const isOut = outgoing(message);
                // On the staff side, colleagues' replies are signed; the customer sees the manager's name once per run.
                const showAuthor =
                  message.from_staff && message.sender && (!previous || previous.from_staff !== message.from_staff || previous.sender?.id !== message.sender.id || newDay);
                const author = showAuthor ? (viewer === "staff" && message.sender!.id === myId ? null : message.sender!.name) : null;

                return (
                  <Fragment key={message.localKey ?? message.id}>
                    {newDay && (
                      <li className="sticky top-0 z-10 flex justify-center py-2">
                        <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm ring-1 ring-border backdrop-blur">
                          {dayLabel(message.created_at, locale, c)}
                        </span>
                      </li>
                    )}
                    {message.id === firstUnreadId && (
                      <li className="flex items-center gap-3 py-2 text-xs font-bold text-primary">
                        <span className="h-px flex-1 bg-primary/40" />
                        {c.newMessages}
                        <span className="h-px flex-1 bg-primary/40" />
                      </li>
                    )}
                    <li data-id={message.id} className={cn(!newDay && previous && outgoing(previous) !== isOut && "pt-2")}>
                      <MessageBubble
                        message={message}
                        outgoing={isOut}
                        author={author}
                        canEdit={canEdit(message)}
                        orderHref={orderHref}
                        highlighted={highlight === message.id}
                        onReply={startReply}
                        onEdit={startEdit}
                        onDelete={setDeleting}
                        onCopy={copy}
                        onOpenImage={openImage}
                        onJumpTo={jumpTo}
                        onRetry={thread.retry}
                        onDiscard={thread.discard}
                      />
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </>
        )}

        {typing && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex gap-1 rounded-2xl rounded-bl-md border border-border bg-surface px-3 py-2.5">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
            {typing} {c.typing}
          </div>
        )}
      </div>

      {unseen > 0 || (!atBottom && messages.length > 0) ? (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          aria-label={c.scrollDown}
          className="absolute bottom-24 right-4 grid size-11 place-items-center rounded-full border border-border bg-surface shadow-lg transition hover:bg-muted"
        >
          <ArrowDown className="size-5" />
          {unseen > 0 && (
            <span className="absolute -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-ink">{unseen}</span>
          )}
        </button>
      ) : null}

      <Composer
        limits={limits}
        files={files}
        onFilesChange={setFiles}
        replyTo={replyTo}
        editing={editing}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditing(null)}
        onSend={send}
        onSaveEdit={saveEdit}
        onTyping={() => thread.notifyTyping(myName)}
        product={product}
        onClearProduct={onClearProduct}
        suggestions={messages.length === 0 || viewer === "staff" ? suggestions : undefined}
        autoFocus={autoFocus}
      />

      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-brand-soft/90 text-center">
          <div>
            <ImagePlus className="mx-auto size-10" />
            <p className="mt-2 font-bold">{c.attach}</p>
          </div>
        </div>
      )}

      {viewerImages && (
        <ImageViewer
          images={viewerImages.images}
          index={viewerImages.index}
          onIndex={(index) => setViewerImages({ ...viewerImages, index })}
          onClose={() => setViewerImages(null)}
        />
      )}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogTitle className="text-lg font-extrabold">{c.deleteTitle}</DialogTitle>
          <DialogDescription>{c.deleteText}</DialogDescription>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {c.cancel}
            </Button>
            <Button onClick={() => void confirmDelete()} className="bg-destructive text-white hover:bg-destructive/90">
              {c.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
