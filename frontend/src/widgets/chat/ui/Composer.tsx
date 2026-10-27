"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Boxes, CornerUpLeft, FileText, LoaderCircle, Paperclip, Pencil, SendHorizontal, Smile, X } from "lucide-react";
import type { ChatProductDraft } from "@/entities/chat/model/panel";
import type { ChatInfo, ChatMessage } from "@/entities/chat/model/types";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu";
import { fileSize } from "../lib/format";

const EMOJI = ["👍", "🙏", "😊", "😂", "🔥", "❤️", "👌", "✅", "🤝", "💪", "😉", "😍", "🙂", "😅", "🤔", "😢", "👏", "🎉", "📦", "🚚", "🧱", "🏗️", "🔧", "🪟", "🚪", "🎨", "💰", "📍", "⏰", "📞", "❗", "❓"];

export type ComposerLimits = ChatInfo["limits"];

type Props = {
  limits: ComposerLimits;
  files: File[];
  onFilesChange: (files: File[]) => void;
  replyTo: ChatMessage | null;
  editing: ChatMessage | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSend: (text: string) => void;
  onSaveEdit: (message: ChatMessage, text: string) => Promise<void>;
  onTyping: () => void;
  /** Product card that goes with the next message ("ask about this product"). */
  product?: ChatProductDraft | null;
  onClearProduct?: () => void;
  /** Ready-made phrases above the field (quick replies for managers, first questions for customers). */
  suggestions?: readonly string[];
  autoFocus?: boolean;
};

/** Checks the type, size and number of new files; returns the accepted list. */
export function acceptFiles(current: File[], added: File[], limits: ComposerLimits, t: ReturnType<typeof useI18n>["t"]["chat"]): File[] {
  const next = [...current];

  for (const file of added) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!limits.file_types.includes(extension)) {
      toast.error(fmt(t.badType, { name: file.name }));
    } else if (file.size > limits.max_file_size_kb * 1024) {
      toast.error(fmt(t.tooBig, { name: file.name, size: Math.round(limits.max_file_size_kb / 1024) }));
    } else if (next.length >= limits.max_files) {
      toast.error(fmt(t.tooMany, { count: limits.max_files }));
      break;
    } else {
      next.push(file);
    }
  }

  return next;
}

export function Composer({ limits, files, onFilesChange, replyTo, editing, onCancelReply, onCancelEdit, onSend, onSaveEdit, onTyping, product, onClearProduct, suggestions, autoFocus }: Props) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const previews = useRef(new Map<File, string>());

  // Editing puts the old text into the field; leaving edit mode clears it. Replying keeps what was typed.
  const [editingId, setEditingId] = useState<number | null>(editing?.id ?? null);
  if ((editing?.id ?? null) !== editingId) {
    setEditingId(editing?.id ?? null);
    setText(editing?.body ?? "");
  }

  useEffect(() => {
    if (editing || replyTo) field.current?.focus();
  }, [editing, replyTo]);

  // Grows with the text up to ~6 lines.
  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const preview = (file: File) => {
    if (!previews.current.has(file)) previews.current.set(file, URL.createObjectURL(file));
    return previews.current.get(file)!;
  };

  const canSend = editing ? text.trim() !== (editing.body ?? "") : text.trim() !== "" || files.length > 0 || Boolean(product);

  const submit = async () => {
    if (!canSend || saving) return;

    if (editing) {
      setSaving(true);
      try {
        await onSaveEdit(editing, text);
      } finally {
        setSaving(false);
      }
      return;
    }

    onSend(text);
    setText("");
    field.current?.focus();
  };

  const insert = (value: string) => {
    const element = field.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + value + text.slice(end));
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + value.length, start + value.length);
    });
  };

  return (
    <div className="border-t border-border bg-surface p-2.5 sm:p-3">
      {suggestions && suggestions.length > 0 && !editing && text === "" && files.length === 0 && (
        <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
          {suggestions.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => {
                setText(phrase);
                field.current?.focus();
              }}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:bg-brand-soft"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {(replyTo || editing) && (
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted px-3 py-2">
          {editing ? <Pencil className="size-4 shrink-0 text-primary" /> : <CornerUpLeft className="size-4 shrink-0 text-primary" />}
          <span className="min-w-0 flex-1 border-l-2 border-primary pl-2.5 text-sm">
            <b className="block text-xs text-primary">{editing ? c.editing : replyTo!.from_staff ? c.manager : c.client}</b>
            <span className="line-clamp-1 text-muted-foreground">{(editing ?? replyTo)!.body || `📎 ${c.file}`}</span>
          </span>
          <button type="button" onClick={editing ? onCancelEdit : onCancelReply} aria-label={c.cancel} className="grid size-7 place-items-center rounded-full hover:bg-surface">
            <X className="size-4" />
          </button>
        </div>
      )}

      {product && !editing && (
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted px-3 py-2">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt="" className="size-10 shrink-0 rounded-lg bg-surface object-cover" />
          ) : (
            <Boxes className="size-5 shrink-0 text-primary" />
          )}
          <span className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold">{product.name}</span>
          <button type="button" onClick={onClearProduct} aria-label={c.discard} className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-surface">
            <X className="size-4" />
          </button>
        </div>
      )}

      {files.length > 0 && !editing && (
        <ul className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative shrink-0">
              {file.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview(file)} alt={file.name} className="size-16 rounded-xl object-cover" />
              ) : (
                <span className="flex h-16 w-36 items-center gap-2 rounded-xl bg-muted px-2.5 text-xs">
                  <FileText className="size-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <b className="block truncate">{file.name}</b>
                    <span className="text-muted-foreground">{fileSize(file.size, locale)}</span>
                  </span>
                </span>
              )}
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                aria-label={c.discard}
                className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink text-white shadow"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-1.5">
        {!editing && (
          <>
            <input
              ref={picker}
              type="file"
              multiple
              hidden
              accept={limits.file_types.map((type) => `.${type}`).join(",")}
              onChange={(event) => {
                onFilesChange(acceptFiles(files, Array.from(event.target.files ?? []), limits, c));
                event.target.value = "";
              }}
            />
            <button type="button" onClick={() => picker.current?.click()} aria-label={c.attach} title={c.attach} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Paperclip className="size-5" />
            </button>
          </>
        )}

        <div className="flex min-w-0 flex-1 items-end rounded-3xl border border-border bg-muted/60 pl-4 transition focus-within:border-primary focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            ref={field}
            rows={1}
            value={text}
            autoFocus={autoFocus}
            placeholder={c.placeholder}
            aria-label={c.placeholder}
            title={c.hint}
            maxLength={4000}
            onChange={(event) => {
              setText(event.target.value);
              if (event.target.value) onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void submit();
              }
              if (event.key === "Escape" && (editing || replyTo)) (editing ? onCancelEdit : onCancelReply)();
            }}
            onPaste={(event) => {
              const pasted = Array.from(event.clipboardData.files);
              if (pasted.length && !editing) {
                event.preventDefault();
                onFilesChange(acceptFiles(files, pasted, limits, c));
              }
            }}
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger aria-label={c.emoji} className="mb-0.5 mr-0.5 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:text-foreground">
              <Smile className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="grid w-72 grid-cols-8 gap-0.5 rounded-2xl p-2">
              {EMOJI.map((emoji) => (
                <button key={emoji} type="button" onClick={() => insert(emoji)} className="grid size-8 place-items-center rounded-lg text-xl transition hover:bg-muted">
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSend || saving}
          aria-label={editing ? c.save : c.send}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full transition",
            canSend ? "bg-brand text-ink shadow-sm hover:bg-brand-hover active:scale-95" : "bg-muted text-muted-foreground",
          )}
        >
          {saving ? <LoaderCircle className="size-5 animate-spin" /> : editing ? <Pencil className="size-5" /> : <SendHorizontal className="size-5" />}
        </button>
      </div>
    </div>
  );
}
