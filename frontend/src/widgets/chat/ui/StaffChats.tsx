"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, MessagesSquare, Package, Phone, Search, Wallet } from "lucide-react";
import { inboxKey, type InboxFilter, STAFF_CHAT_LIMITS, useInbox } from "@/entities/chat/api/useInbox";
import { useChatThread } from "@/entities/chat/api/useChatThread";
import type { ChatMessage, InboxConversation, InboxDetails } from "@/entities/chat/model/types";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatMoney, formatPhone } from "@/shared/lib/format";
import { playMessageSound } from "@/shared/lib/sound";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { chatTime, dayLabel, presence } from "../lib/format";
import { ChatThreadView } from "./ChatThreadView";

type Me = { id: number; name: string; isAdmin: boolean };

function Avatar({ name, online, size = "size-11" }: { name: string; online?: boolean; size?: string }) {
  return (
    <span className="relative shrink-0">
      <span className={cn("grid place-items-center rounded-full bg-ink font-display font-extrabold text-brand", size)}>{name.charAt(0).toUpperCase()}</span>
      {online && <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-success" />}
    </span>
  );
}

/**
 * Manager's inbox: conversations on the left (unread first, search, filters), the open conversation
 * in the middle, the customer card with orders on the right. On phones the list and the conversation take turns.
 */
export function StaffChats({ me, conversationId }: { me: Me; conversationId: number | null }) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");

  const onCustomerMessage = useCallback(
    (message: ChatMessage) => {
      if (document.hidden || message.conversation_id !== conversationId) playMessageSound();
    },
    [conversationId],
  );
  const { data: inbox, isLoading } = useInbox(search, filter, onCustomerMessage);

  const preview = (row: InboxConversation) => {
    const last = row.last_message;
    if (!last) return "";
    const text = last.is_deleted ? c.deleted : last.body || (last.has_attachments ? `📎 ${c.file}` : last.has_order ? `📦 ${c.order}` : "🧱");
    return last.from_staff ? `${c.you}: ${text}` : text;
  };

  return (
    <div className="grid h-full min-h-0 overflow-hidden rounded-2xl border border-border bg-surface md:grid-cols-[340px_1fr]">
      <aside className={cn("flex min-h-0 flex-col border-border md:border-r", conversationId !== null && "max-md:hidden")}>
        <div className="space-y-3 border-b border-border p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-extrabold">{c.inbox}</h1>
            {inbox && inbox.meta.unread_conversations > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">{inbox.meta.unread_conversations}</span>
            )}
          </div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={c.search}
              aria-label={c.search}
              className="h-10 w-full rounded-full border border-border bg-muted/60 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:bg-surface"
            />
          </label>
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {(["all", "unread", "mine"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={cn("rounded-lg py-1.5 text-xs font-semibold transition", filter === key ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {c.filters[key]}
              </button>
            ))}
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <li className="p-6 text-center text-sm text-muted-foreground">…</li>
          ) : !inbox?.data.length ? (
            <li className="grid place-items-center px-6 py-14 text-center">
              <MessagesSquare className="size-9 text-muted-foreground" />
              <p className="mt-3 font-bold">{c.noChats}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.noChatsText}</p>
            </li>
          ) : (
            inbox.data.map((row) => {
              const at = row.last_message?.created_at ?? row.last_message_at;
              const when = at ? (dayLabel(at, locale, c) === c.today ? chatTime(at, locale) : dayLabel(at, locale, c)) : "";

              return (
                <li key={row.id}>
                  <Link
                    href={routes.adminChat(row.id)}
                    className={cn("flex gap-3 border-b border-border/60 px-3 py-3 transition hover:bg-muted/60", row.id === conversationId && "bg-brand-soft hover:bg-brand-soft")}
                  >
                    <Avatar name={row.client.name} online={row.client.is_online} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <b className="min-w-0 flex-1 truncate text-sm">{row.client.name}</b>
                        <span className={cn("shrink-0 text-[11px]", row.unread_count ? "font-bold text-primary" : "text-muted-foreground")}>{when}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={cn("min-w-0 flex-1 truncate text-[13px]", row.unread_count ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {preview(row)}
                        </span>
                        {row.unread_count > 0 && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-ink">{row.unread_count}</span>
                        )}
                      </span>
                      {row.manager && row.manager.id !== me.id && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">→ {row.manager.name}</span>}
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section className={cn("min-h-0", conversationId === null && "max-md:hidden")}>
        {conversationId === null ? (
          <div className="grid h-full place-items-center p-6 text-center text-muted-foreground">
            <div>
              <MessagesSquare className="mx-auto size-12" />
              <p className="mt-3 font-semibold">{c.pick}</p>
            </div>
          </div>
        ) : (
          <StaffConversation key={conversationId} id={conversationId} me={me} onBack={() => router.push(routes.adminChats)} />
        )}
      </section>
    </div>
  );
}

function StaffConversation({ id, me, onBack }: { id: number; me: Me; onBack: () => void }) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const queryClient = useQueryClient();
  const detailsKey = ["chat-details", id] as const;

  const { data: details, isError } = useQuery({
    queryKey: detailsKey,
    queryFn: async () => (await bff<{ data: InboxDetails }>(`/api/proxy/admin/chats/${id}`, { method: "GET" })).data,
    refetchInterval: 60_000,
  });

  const onRead = useCallback(() => void queryClient.invalidateQueries({ queryKey: inboxKey }), [queryClient]);
  const thread = useChatThread({ conversationId: id, basePath: `/api/proxy/admin/chats/${id}`, viewer: "staff", active: true, onRead });

  if (isError) return <p className="grid h-full place-items-center text-sm text-muted-foreground">{c.error}</p>;

  const client = details?.client;

  return (
    <div className="grid h-full min-h-0 xl:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
          <button type="button" onClick={onBack} aria-label={c.back} className="grid size-9 place-items-center rounded-full hover:bg-muted md:hidden">
            <ArrowLeft className="size-5" />
          </button>
          {client && <Avatar name={client.name} online={client.is_online} size="size-10" />}
          <span className="min-w-0 flex-1">
            <b className="block truncate">{client?.name ?? "…"}</b>
            <span className={cn("block truncate text-xs", thread.typing ? "font-semibold text-primary" : client?.is_online ? "text-success" : "text-muted-foreground")}>
              {thread.typing ? c.typing : client ? presence(client.is_online, client.last_seen_at, locale, c) : ""}
            </span>
          </span>
          {client?.phone && (
            <a href={`tel:${client.phone}`} aria-label={c.call} title={formatPhone(client.phone)} className="grid size-9 place-items-center rounded-full bg-success/10 text-success transition hover:bg-success/20">
              <Phone className="size-4" />
            </a>
          )}
        </header>

        <ChatThreadView
          thread={thread}
          viewer="staff"
          myId={me.id}
          myName={me.name}
          limits={STAFF_CHAT_LIMITS}
          orderHref={routes.adminOrder}
          suggestions={c.replies}
          autoFocus
          className="flex-1"
        />
      </div>

      {details && <ClientCard details={details} me={me} onAssigned={() => void queryClient.invalidateQueries({ queryKey: detailsKey })} />}
    </div>
  );
}

function ClientCard({ details, me, onAssigned }: { details: InboxDetails; me: Me; onAssigned: () => void }) {
  const { t, locale } = useI18n();
  const c = t.chat;
  const queryClient = useQueryClient();

  const { data: staff } = useQuery({
    queryKey: ["chat-staff"],
    queryFn: async () => (await bff<{ data: { id: number; name: string }[] }>("/api/proxy/admin/chats/staff", { method: "GET" })).data,
    enabled: me.isAdmin,
    staleTime: 5 * 60_000,
  });

  const assign = async (value: string) => {
    try {
      await bff(`/api/proxy/admin/chats/${details.id}/manager`, { method: "PATCH", body: { manager_id: value === "none" ? null : Number(value) } });
      onAssigned();
      void queryClient.invalidateQueries({ queryKey: inboxKey });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    }
  };

  return (
    <aside className="hidden min-h-0 overflow-y-auto border-l border-border p-4 xl:block">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.clientCard}</p>
      <div className="mt-3 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-ink font-display text-2xl font-extrabold text-brand">{details.client.name.charAt(0)}</span>
        <p className="mt-2 font-bold">{details.client.name}</p>
        {details.client.phone && (
          <a href={`tel:${details.client.phone}`} className="text-sm font-semibold text-primary hover:underline">
            {formatPhone(details.client.phone)}
          </a>
        )}
        <p className="truncate text-xs text-muted-foreground">{details.client.email}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-muted p-2.5">
          <Package className="mx-auto size-4 text-primary" />
          <dd className="mt-1 font-display text-lg font-extrabold">{details.orders_count}</dd>
          <dt className="text-[11px] text-muted-foreground">{c.orders}</dt>
        </div>
        <div className="rounded-xl bg-muted p-2.5">
          <Wallet className="mx-auto size-4 text-primary" />
          <dd className="mt-1 truncate font-display text-sm font-extrabold leading-7">{formatMoney(details.orders_spent, locale)}</dd>
          <dt className="text-[11px] text-muted-foreground">{c.spent}</dt>
        </div>
      </dl>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        {fmt(c.since, { date: formatDate(details.client_since, locale) })}
      </p>

      <div className="mt-5">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.responsible}</p>
        {me.isAdmin && staff ? (
          <Select value={details.manager ? String(details.manager.id) : "none"} onValueChange={(value) => void assign(value)}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{c.unassigned}</SelectItem>
              {staff.map((person) => (
                <SelectItem key={person.id} value={String(person.id)}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm font-semibold">{details.manager?.name ?? c.unassigned}</p>
        )}
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.recentOrders}</p>
        {details.recent_orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{c.noOrders}</p>
        ) : (
          <ul className="space-y-1.5">
            {details.recent_orders.map((order) => (
              <li key={order.number}>
                <Link href={routes.adminOrder(order.number)} className="block rounded-xl border border-border p-2.5 text-sm transition hover:border-primary">
                <span className="flex justify-between gap-2">
                  <b>{order.number}</b>
                  <span className="font-semibold">{formatMoney(order.total, locale)}</span>
                </span>
                <span className="mt-0.5 flex justify-between gap-2 text-xs text-muted-foreground">
                  <span>{order.status.label}</span>
                  <span>{formatDate(order.created_at, locale)}</span>
                </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
