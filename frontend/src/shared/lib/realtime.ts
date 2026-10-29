"use client";

import type Echo from "laravel-echo";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { env } from "@/shared/config/env";

type ReverbEcho = Echo<"reverb">;
type PrivateChannel = ReturnType<ReverbEcho["private"]>;

let echo: ReverbEcho | null = null;
let loading: Promise<ReverbEcho | null> | null = null;
const channelUsers = new Map<string, number>();
const stateListeners = new Set<() => void>();
let connected = false;

/**
 * One WebSocket connection to Laravel Reverb for the whole tab. Private channels are authorised through
 * the BFF (/api/proxy/broadcasting/auth adds the token from the httpOnly cookie), so the token never
 * reaches JavaScript. Null when the WebSocket is not configured — callers fall back to polling.
 * laravel-echo and pusher-js are downloaded only here, on first use — not by every visitor of the shop.
 */
export function loadEcho(): Promise<ReverbEcho | null> {
  if (typeof window === "undefined" || !env.reverb.key) return Promise.resolve(null);
  if (echo) return Promise.resolve(echo);

  loading ??= Promise.all([import("laravel-echo"), import("pusher-js")])
    .then(([{ default: EchoClient }, { default: Pusher }]) => connect(EchoClient, Pusher))
    .catch(() => null)
    .finally(() => {
      loading = null;
    });

  return loading;
}

function connect(EchoClient: typeof Echo, Pusher: typeof import("pusher-js").default): ReverbEcho {
  const secure = env.reverb.scheme === "https";

  echo = new EchoClient({
    broadcaster: "reverb",
    key: env.reverb.key,
    wsHost: env.reverb.host,
    wsPort: env.reverb.port,
    wssPort: env.reverb.port,
    forceTLS: secure,
    enabledTransports: secure ? ["wss"] : ["ws"],
    Pusher,
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data: { auth: string } | null) => void) => {
        fetch("/api/proxy/broadcasting/auth", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`Channel auth ${response.status}`))))
          .then((data) => callback(null, data))
          .catch((error: Error) => callback(error, null));
      },
    }),
  });

  echo.connector.pusher.connection.bind("state_change", ({ current }: { current: string }) => {
    connected = current === "connected";
    stateListeners.forEach((listener) => listener());
  });

  return echo;
}

/** Closes the socket (after sign out), so the next user starts clean. Downloads nothing when there is none. */
export function disconnectRealtime() {
  echo?.disconnect();
  echo = null;
  channelUsers.clear();
  connected = false;
  stateListeners.forEach((listener) => listener());
}

/** Whether live updates are flowing; while false, chat data is refreshed by polling. */
export function useRealtimeConnected(): boolean {
  return useSyncExternalStore(
    (listener) => {
      stateListeners.add(listener);
      void loadEcho();
      return () => stateListeners.delete(listener);
    },
    () => connected,
    () => false,
  );
}

type Handlers = Record<string, (payload: never) => void>;
type Ref<T> = { current: T };

/**
 * Joins a channel and binds the events and whispers; the returned function undoes it and leaves
 * the channel when no other component uses it.
 */
function subscribe(client: ReverbEcho, name: string, eventNames: string, whisperNames: string, handlers: { events: Ref<Handlers>; whispers: Ref<Handlers>; channel: Ref<PrivateChannel | null> }): () => void {
  const channel = client.private(name);
  channelUsers.set(name, (channelUsers.get(name) ?? 0) + 1);
  handlers.channel.current = channel;

  const bound = eventNames.split("|").filter(Boolean).map((event) => {
    const handler = (payload: never) => handlers.events.current[event]?.(payload);
    channel.listen(event, handler);
    return [event, handler] as const;
  });
  const boundWhispers = whisperNames.split("|").filter(Boolean).map((event) => {
    const handler = (payload: never) => handlers.whispers.current[event]?.(payload);
    channel.listenForWhisper(event, handler);
    return [event, handler] as const;
  });

  return () => {
    bound.forEach(([event, handler]) => channel.stopListening(event, handler));
    boundWhispers.forEach(([event, handler]) => channel.stopListeningForWhisper(event, handler));
    handlers.channel.current = null;

    const users = (channelUsers.get(name) ?? 1) - 1;
    if (users <= 0) {
      channelUsers.delete(name);
      client.leave(name);
    } else {
      channelUsers.set(name, users);
    }
  };
}

/**
 * Subscribes to a private channel while the component is mounted. Several components may share a channel:
 * it is left only when the last one unmounts. Event names start with "." (custom broadcastAs names).
 * Returns a ref to the channel for whispers ("typing…").
 */
export function usePrivateChannel(name: string | null, events: Handlers, whispers: Handlers = {}) {
  const channelRef = useRef<PrivateChannel | null>(null);
  const eventsRef = useRef(events);
  const whispersRef = useRef(whispers);

  useEffect(() => {
    eventsRef.current = events;
    whispersRef.current = whispers;
  });

  const eventNames = Object.keys(events).sort().join("|");
  const whisperNames = Object.keys(whispers).sort().join("|");

  useEffect(() => {
    if (!name) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void loadEcho().then((client) => {
      if (client && !cancelled) unsubscribe = subscribe(client, name, eventNames, whisperNames, { events: eventsRef, whispers: whispersRef, channel: channelRef });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [name, eventNames, whisperNames]);

  return channelRef;
}
