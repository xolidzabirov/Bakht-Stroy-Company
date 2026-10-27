"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Maximize2, X } from "lucide-react";
import { chatInfoKey, useChatInfo } from "@/entities/chat/api/useChatInfo";
import { useChatThread } from "@/entities/chat/api/useChatThread";
import { chatPanel, useChatPanel } from "@/entities/chat/model/panel";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { playMessageSound } from "@/shared/lib/sound";
import { useSessionName } from "@/shared/lib/useSession";
import { LogoMark } from "@/shared/ui";
import { presence } from "../lib/format";
import { ChatThreadView } from "./ChatThreadView";

/**
 * The customer's conversation with the shop — in the floating window ("panel") or full screen in the account ("page").
 */
export function ClientChat({ variant, active }: { variant: "panel" | "page"; active: boolean }) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const queryClient = useQueryClient();
  const name = useSessionName() ?? "";
  const { data: info, isError } = useChatInfo(true, { silent: true });
  const { product } = useChatPanel();

  // The open window plays the ding only when the tab is in the background.
  const onIncoming = useCallback(() => {
    if (document.hidden || !active) playMessageSound();
  }, [active]);
  const onRead = useCallback(() => void queryClient.invalidateQueries({ queryKey: chatInfoKey }), [queryClient]);

  const thread = useChatThread({ conversationId: info?.id ?? null, basePath: "/api/proxy/chat", viewer: "client", active, onIncoming, onRead });
  const manager = info?.manager;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <span className="relative shrink-0">
          {manager?.is_assigned ? (
            <span className="grid size-11 place-items-center rounded-full bg-ink font-display text-lg font-extrabold text-brand">{manager.name.charAt(0)}</span>
          ) : (
            <LogoMark className="size-11" />
          )}
          {manager?.is_online && <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-success" />}
        </span>
        <span className="min-w-0 flex-1">
          <b className="block truncate">{manager ? (manager.is_assigned ? manager.name : c.team) : c.title}</b>
          <span className={cn("block truncate text-xs", thread.typing ? "font-semibold text-primary" : manager?.is_online ? "text-success" : "text-muted-foreground")}>
            {thread.typing ? c.typing : manager ? `${manager.is_assigned ? `${c.manager} · ` : ""}${presence(manager.is_online, manager.last_seen_at, locale, c)}` : "…"}
          </span>
        </span>
        {variant === "panel" && (
          <>
            <Link href={routes.accountChat} onClick={() => chatPanel.close()} aria-label={c.fullscreen} title={c.fullscreen} className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <Maximize2 className="size-4" />
            </Link>
            <button type="button" onClick={() => chatPanel.close()} aria-label={c.close} className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <X className="size-5" />
            </button>
          </>
        )}
      </header>

      {info ? (
        <ChatThreadView
          thread={thread}
          viewer="client"
          myName={name}
          limits={info.limits}
          orderHref={routes.accountOrder}
          suggestions={c.quick}
          autoFocus={variant === "panel"}
          product={product}
          onClearProduct={chatPanel.clearProduct}
          className="flex-1"
        />
      ) : (
        <div className="grid flex-1 place-items-center p-6 text-sm text-muted-foreground">{isError ? c.error : "…"}</div>
      )}
    </div>
  );
}
