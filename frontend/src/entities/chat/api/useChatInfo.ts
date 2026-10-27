"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bff } from "@/shared/api/client";
import { usePrivateChannel } from "@/shared/lib/realtime";
import { playMessageSound } from "@/shared/lib/sound";
import type { ChatInfo, ChatMessage } from "../model/types";

export const chatInfoKey = ["chat-info"] as const;

/**
 * The customer's conversation: who answers, are they online, how many replies are unread.
 * Refreshed every minute (this also keeps the customer "online" for the manager) and right away
 * when the shop writes. `silent` turns off the ding (the open chat window plays its own).
 */
export function useChatInfo(enabled: boolean, { silent = false }: { silent?: boolean } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatInfoKey,
    queryFn: async () => (await bff<{ data: ChatInfo }>("/api/proxy/chat", { method: "GET" })).data,
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  usePrivateChannel(enabled && query.data ? `chat.${query.data.id}` : null, {
    ".message.sent": ({ message }: { message: ChatMessage }) => {
      if (!message.from_staff) return;
      if (!silent) playMessageSound();
      void queryClient.invalidateQueries({ queryKey: chatInfoKey });
    },
    ".messages.read": () => void queryClient.invalidateQueries({ queryKey: chatInfoKey }),
  });

  return query;
}
