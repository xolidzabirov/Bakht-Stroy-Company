"use client";

import { type InfiniteData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bff } from "@/shared/api/client";
import { usePrivateChannel, useRealtimeConnected } from "@/shared/lib/realtime";
import type { ChatMessage, ChatPage, ChatViewer, OutgoingMessage } from "../model/types";

type Pages = InfiniteData<ChatPage, number | undefined>;

type Options = {
  /** Conversation id (for the live channel); null while unknown. */
  conversationId: number | null;
  /** "/api/proxy/chat" for the customer, "/api/proxy/admin/chats/{id}" for the shop team. */
  basePath: string;
  viewer: ChatViewer;
  /** The window is open and on screen: incoming messages get read right away. */
  active: boolean;
  /** Called for every new message from the other side (sound, badge). */
  onIncoming?: (message: ChatMessage) => void;
  /** Called after the other side's messages were marked read here. */
  onRead?: () => void;
};

const TYPING_SHOWN_MS = 4000;
const TYPING_SEND_EVERY_MS = 2500;
const POLL_MS = 5000;

/**
 * One conversation: history (newest page first, older on demand), live events over WebSocket with
 * polling as the fallback, optimistic sending with retry, edit / delete, read marks and "typing…".
 */
export function useChatThread({ conversationId, basePath, viewer, active, onIncoming, onRead }: Options) {
  const queryClient = useQueryClient();
  const connected = useRealtimeConnected();
  const key = useMemo(() => ["chat-thread", basePath] as const, [basePath]);
  const messagesPath = `${basePath}/messages`;
  const isIncoming = useCallback((message: ChatMessage) => (viewer === "client" ? message.from_staff : !message.from_staff), [viewer]);

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => bff<ChatPage>(`${messagesPath}${pageParam ? `?before_id=${pageParam}` : ""}`, { method: "GET" }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) => (page.meta.has_more ? page.data[0]?.id : undefined),
    enabled: conversationId !== null,
    refetchInterval: connected ? false : POLL_MS,
    staleTime: connected ? Infinity : POLL_MS,
  });

  /* ---------- cache helpers ---------- */

  const upsert = useCallback(
    (message: ChatMessage) =>
      queryClient.setQueryData<Pages>(key, (data) => {
        if (!data) return data;
        let found = false;
        const pages = data.pages.map((page) => ({
          ...page,
          data: page.data.map((item) => {
            if (item.id !== message.id) return item;
            found = true;
            return message;
          }),
        }));
        if (!found && pages[0]) pages[0] = { ...pages[0], data: [...pages[0].data, message].sort((a, b) => a.id - b.id) };
        return { ...data, pages };
      }),
    [queryClient, key],
  );

  const markReadLocally = useCallback(
    (fromStaff: boolean, upToId: number, readAt: string) =>
      queryClient.setQueryData<Pages>(key, (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.map((m) => (m.from_staff === fromStaff && m.id <= upToId && !m.read_at ? { ...m, read_at: readAt } : m)),
          })),
        },
      ),
    [queryClient, key],
  );

  /* ---------- live events ---------- */

  const [typing, setTyping] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channel = usePrivateChannel(
    conversationId ? `chat.${conversationId}` : null,
    {
      ".message.sent": ({ message }: { message: ChatMessage }) => {
        upsert(message);
        if (isIncoming(message)) {
          setTyping(null);
          onIncoming?.(message);
        }
      },
      ".message.updated": ({ message }: { message: ChatMessage }) => upsert(message),
      // by_staff = the shop read the customer's messages.
      ".messages.read": ({ by_staff, up_to_id, read_at }: { by_staff: boolean; up_to_id: number; read_at: string }) =>
        markReadLocally(!by_staff, up_to_id, read_at),
    },
    {
      typing: ({ staff, name }: { staff: boolean; name: string }) => {
        if (staff === (viewer === "staff")) return;
        setTyping(name);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(null), TYPING_SHOWN_MS);
      },
    },
  );

  const lastTypingSent = useRef(0);
  const notifyTyping = useCallback(
    (name: string) => {
      if (Date.now() - lastTypingSent.current < TYPING_SEND_EVERY_MS) return;
      lastTypingSent.current = Date.now();
      channel.current?.whisper("typing", { staff: viewer === "staff", name });
    },
    [channel, viewer],
  );

  useEffect(() => () => void (typingTimer.current && clearTimeout(typingTimer.current)), []);

  /* ---------- messages on screen ---------- */

  const [pending, setPending] = useState<ChatMessage[]>([]);
  const outbox = useRef(new Map<string, OutgoingMessage>());

  const messages = useMemo(() => {
    const seen = new Set<number>();
    const loaded = (query.data?.pages ?? [])
      .slice()
      .reverse()
      .flatMap((page) => page.data)
      .filter((message) => !seen.has(message.id) && seen.add(message.id));
    return [...loaded, ...pending];
  }, [query.data, pending]);

  /* ---------- read marks ---------- */

  const unreadIncoming = messages.some((m) => m.id > 0 && isIncoming(m) && !m.read_at && !m.is_deleted);
  const reading = useRef(false);

  useEffect(() => {
    if (!active || !unreadIncoming || reading.current) return;

    const read = () => {
      if (document.visibilityState !== "visible" || reading.current) return;
      reading.current = true;
      const maxId = Math.max(...messages.filter(isIncoming).map((m) => m.id));
      markReadLocally(viewer === "client", maxId, new Date().toISOString());
      bff(`${basePath}/read`)
        .then(() => onRead?.())
        .catch(() => null)
        .finally(() => (reading.current = false));
    };

    read();
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, [active, unreadIncoming, messages, isIncoming, markReadLocally, viewer, basePath, onRead]);

  /* ---------- sending ---------- */

  const deliver = useCallback(
    async (localKey: string, out: OutgoingMessage) => {
      const fields: Record<string, string> = {};
      if (out.body.trim()) fields.body = out.body.trim();
      if (out.replyTo) fields.reply_to_id = String(out.replyTo.id);
      if (out.productId) fields.product_id = String(out.productId);
      if (out.orderNumber) fields.order_number = out.orderNumber;

      let body: FormData | Record<string, string> = fields;
      if (out.files.length) {
        const form = new FormData();
        Object.entries(fields).forEach(([name, value]) => form.append(name, value));
        out.files.forEach((file) => form.append("attachments[]", file));
        body = form;
      }

      try {
        const { data } = await bff<{ data: ChatMessage }>(messagesPath, { body });
        upsert(data);
        outbox.current.delete(localKey);
        setPending((list) => {
          list.filter((m) => m.localKey === localKey).forEach((m) => m.attachments.forEach((a) => URL.revokeObjectURL(a.url)));
          return list.filter((m) => m.localKey !== localKey);
        });
      } catch {
        setPending((list) => list.map((m) => (m.localKey === localKey ? { ...m, pending: "failed" } : m)));
      }
    },
    [messagesPath, upsert],
  );

  const send = useCallback(
    (out: OutgoingMessage) => {
      const localKey = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      outbox.current.set(localKey, out);
      setPending((list) => [
        ...list,
        {
          id: -Date.now(),
          conversation_id: conversationId ?? 0,
          from_staff: viewer === "staff",
          sender: null,
          body: out.body.trim() || null,
          attachments: out.files.map((file, index) => {
            const url = URL.createObjectURL(file);
            return { id: -index - 1, name: file.name, size: file.size, mime: file.type, is_image: file.type.startsWith("image/"), url, thumb: url };
          }),
          reply_to: out.replyTo && {
            id: out.replyTo.id,
            from_staff: out.replyTo.from_staff,
            is_deleted: out.replyTo.is_deleted,
            body: out.replyTo.body,
            has_attachments: out.replyTo.attachments.length > 0,
          },
          product: null,
          order: null,
          is_edited: false,
          is_deleted: false,
          read_at: null,
          created_at: new Date().toISOString(),
          pending: "sending",
          localKey,
        },
      ]);
      void deliver(localKey, out);
    },
    [conversationId, viewer, deliver],
  );

  const retry = useCallback(
    (localKey: string) => {
      const out = outbox.current.get(localKey);
      if (!out) return;
      setPending((list) => list.map((m) => (m.localKey === localKey ? { ...m, pending: "sending" } : m)));
      void deliver(localKey, out);
    },
    [deliver],
  );

  const discard = useCallback((localKey: string) => {
    outbox.current.delete(localKey);
    setPending((list) => list.filter((m) => m.localKey !== localKey));
  }, []);

  const edit = useCallback(
    async (id: number, body: string) => upsert((await bff<{ data: ChatMessage }>(`${messagesPath}/${id}`, { method: "PATCH", body: { body } })).data),
    [messagesPath, upsert],
  );

  const remove = useCallback(
    async (id: number) => upsert((await bff<{ data: ChatMessage }>(`${messagesPath}/${id}`, { method: "DELETE" })).data),
    [messagesPath, upsert],
  );

  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    hasOlder: query.hasNextPage,
    loadingOlder: query.isFetchingNextPage,
    loadOlder: query.fetchNextPage,
    connected,
    typing,
    notifyTyping,
    send,
    retry,
    discard,
    edit,
    remove,
    isIncoming,
  };
}

export type ChatThread = ReturnType<typeof useChatThread>;
