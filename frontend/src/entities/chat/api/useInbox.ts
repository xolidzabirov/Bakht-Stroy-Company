"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { bff } from "@/shared/api/client";
import { usePrivateChannel, useRealtimeConnected } from "@/shared/lib/realtime";
import type { ChatInfo, ChatMessage, InboxConversation } from "../model/types";

export type InboxFilter = "all" | "unread" | "mine";
type InboxPage = { data: InboxConversation[]; meta: { unread_conversations: number; total: number } };

export const inboxKey = ["chat-inbox"] as const;

/** Same limits as the API (SendMessageRequest); the staff side has no "my chat" endpoint to read them from. */
export const STAFF_CHAT_LIMITS: ChatInfo["limits"] = {
  max_files: 5,
  max_file_size_kb: 10240,
  file_types: ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "xls", "xlsx", "txt"],
  edit_window_hours: 48,
};

/**
 * Conversations for the shop team, refreshed live from the chat.staff channel
 * (debounced, so a burst of messages causes one reload). Polls while the socket is down.
 */
export function useInbox(search: string, filter: InboxFilter, onCustomerMessage?: (message: ChatMessage) => void) {
  const queryClient = useQueryClient();
  const connected = useRealtimeConnected();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void queryClient.invalidateQueries({ queryKey: inboxKey }), 400);
  };

  usePrivateChannel("chat.staff", {
    ".message.sent": ({ message }: { message: ChatMessage }) => {
      refresh();
      if (!message.from_staff) onCustomerMessage?.(message);
    },
    ".message.updated": refresh,
    ".messages.read": refresh,
  });

  const params = new URLSearchParams({ filter, ...(search.trim() ? { search: search.trim() } : {}) });

  return useQuery({
    queryKey: [...inboxKey, filter, search.trim()],
    queryFn: () => bff<InboxPage>(`/api/proxy/admin/chats?${params}`, { method: "GET" }),
    placeholderData: keepPreviousData,
    refetchInterval: connected ? 60_000 : 8_000,
  });
}
