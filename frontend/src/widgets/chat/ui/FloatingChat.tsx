"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useChatInfo } from "@/entities/chat/api/useChatInfo";
import { chatPanel, useChatPanel } from "@/entities/chat/model/panel";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useMe } from "@/shared/api/useMe";
import { ClientChat } from "./ClientChat";

/**
 * Round chat button in the corner of every shop page (signed-in customers): unread badge, a ding for new replies,
 * and a chat window — a card on desktop, full screen on phones. The window stays mounted once opened,
 * so a half-typed message survives closing it.
 */
export function FloatingChat() {
  const { t } = useI18n();
  // The shop team answers in the admin inbox, not from the customer window.
  const { signedIn, isStaff, isLoading } = useMe();
  const customer = signedIn && !isStaff && !isLoading;
  const { open } = useChatPanel();
  const { data: info } = useChatInfo(customer, { silent: open });
  const [mounted, setMounted] = useState(false);
  const unread = info?.unread_count ?? 0;

  if (open && !mounted) setMounted(true);

  // Esc closes the window; the page behind does not scroll on phones while the chat is full screen.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && chatPanel.close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!customer) return null;

  return (
    <>
      {mounted && (
        <div
          role="dialog"
          aria-label={t.chat.title}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-surface shadow-2xl transition duration-200",
            "inset-0 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-3xl sm:border sm:border-border",
            open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
          )}
        >
          <ClientChat variant="panel" active={open} />
        </div>
      )}

      <button
        type="button"
        onClick={() => chatPanel.toggle()}
        aria-label={open ? t.chat.close : unread ? `${t.chat.open}: ${unread}` : t.chat.open}
        aria-expanded={open}
        className={cn(
          "fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-brand text-ink shadow-xl ring-4 ring-brand/20 transition hover:scale-105 hover:bg-brand-hover active:scale-95",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-surface bg-destructive px-1.5 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
