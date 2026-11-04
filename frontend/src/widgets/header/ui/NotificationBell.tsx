"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, MessageCircle, Newspaper } from "lucide-react";
import { bff } from "@/shared/api/client";
import type { AppNotification, NewsItem } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { useSessionName } from "@/shared/lib/useSession";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu";

const NEWS_SEEN_KEY = "bakht_news_seen";
const MESSAGES_SEEN_KEY = "bakht_notices_seen";
const seenListeners = new Set<() => void>();

function readSeen(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function markSeen(key: string, time: number) {
  try {
    localStorage.setItem(key, String(time));
  } catch {
    // Private mode: the number simply comes back next time.
  }
  seenListeners.forEach((listener) => listener());
}

function subscribeSeen(listener: () => void) {
  seenListeners.add(listener);
  return () => seenListeners.delete(listener);
}

type NoticePage = { data: AppNotification[]; meta: { unread_count: number } };

/**
 * Bell with two tabs: news published on the site and personal messages (order updates, manager replies).
 * Opening the panel is seeing what is new: the number on the bell goes away at once and comes back only for something newer.
 * Inside, the new rows keep their marks, and the other tab keeps its number until it is opened.
 * A message stays unread until it is clicked; only the number goes.
 */
export function NotificationBell({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const signedIn = useSessionName() !== null;
  const [tab, setTab] = useState<"news" | "messages">("news");
  // Controlled, so a click on a post or "Все новости" closes the panel while the page changes.
  const [open, setOpen] = useState(false);
  const newsSeen = useSyncExternalStore(subscribeSeen, () => readSeen(NEWS_SEEN_KEY), () => Number.MAX_SAFE_INTEGER);
  const messagesSeen = useSyncExternalStore(subscribeSeen, () => readSeen(MESSAGES_SEEN_KEY), () => Number.MAX_SAFE_INTEGER);
  // How things looked when the panel was opened: what its rows and the other tab still show.
  const [newsSeenBefore, setNewsSeenBefore] = useState(Number.MAX_SAFE_INTEGER);
  const [tabCounts, setTabCounts] = useState({ news: 0, messages: 0 });
  const n = t.header.notices;

  const { data: news } = useQuery({
    queryKey: ["header-news"],
    queryFn: async () => (await bff<{ data: NewsItem[] }>("/api/proxy/news?per_page=5", { method: "GET" })).data,
    staleTime: 5 * 60_000,
  });

  const { data: notices } = useQuery({
    queryKey: ["header-notices"],
    queryFn: () => bff<NoticePage>("/api/proxy/me/notifications?per_page=6", { method: "GET" }),
    enabled: signedIn,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const freshNews = (news ?? []).filter((item) => item.published_at && Date.parse(item.published_at) > newsSeen).length;
  // The server's own clock for messages, so a wrong clock on the computer cannot hide a new one.
  const unread = signedIn ? (notices?.data ?? []).filter((item) => !item.is_read) : [];
  // Never opened on this device: everything unread counts, even beyond the few loaded here.
  const newMessages = messagesSeen === 0 ? (signedIn ? (notices?.meta.unread_count ?? 0) : 0) : unread.filter((item) => Date.parse(item.created_at) > messagesSeen).length;
  const total = freshNews + newMessages;

  const markAllSeen = () => {
    markSeen(NEWS_SEEN_KEY, Date.now());
    const newest = Math.max(0, ...(notices?.data ?? []).map((item) => Date.parse(item.created_at) || 0));
    if (newest > messagesSeen) markSeen(MESSAGES_SEEN_KEY, newest);
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      const first = freshNews === 0 && newMessages > 0 ? "messages" : "news";
      setTab(first);
      setNewsSeenBefore(newsSeen);
      setTabCounts({ news: first === "news" ? 0 : freshNews, messages: first === "messages" ? 0 : newMessages });
    }
    // Also on closing: whatever arrived while the panel was open has been seen too.
    markAllSeen();
  };

  const openTab = (key: "news" | "messages") => {
    setTab(key);
    setTabCounts((counts) => ({ ...counts, [key]: 0 }));
  };

  const markRead = (id: string) => {
    void bff(`/api/proxy/me/notifications/${id}/read`)
      .then(() => queryClient.invalidateQueries({ queryKey: ["header-notices"] }))
      .catch(() => null);
  };

  const tabs = [
    { key: "news" as const, label: n.news, icon: Newspaper, count: tabCounts.news },
    { key: "messages" as const, label: n.messages, icon: MessageCircle, count: tabCounts.messages },
  ];

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange(next);
      }}
    >
      <DropdownMenuTrigger aria-label={total ? `${n.title}: ${total}` : n.title} title={n.title} className={cn("pill-button relative size-10 px-0", className)}>
        <Bell className="size-[18px]" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-surface bg-destructive px-1 text-[10px] font-bold text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-0 p-0 shadow-2xl shadow-black/15 ring-1 ring-black/5 duration-200 ease-out data-[state=open]:slide-in-from-top-3 data-[state=closed]:slide-out-to-top-2 dark:ring-white/10">
        <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
          <b className="text-base">{n.title}</b>
        </div>

        <div role="tablist" className="mx-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => openTab(key)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-semibold transition",
                tab === key ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
              {count > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] text-white">{count}</span>}
            </button>
          ))}
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-2">
          {tab === "news" ? (
            !news?.length ? (
              <Empty text={n.emptyNews} />
            ) : (
              news.map((item) => {
                const fresh = item.published_at !== null && Date.parse(item.published_at) > newsSeenBefore;

                return (
                  <Link prefetch={false} onClick={() => setOpen(false)} key={item.id} href={routes.newsItem(item.slug)} className="flex gap-3 rounded-xl p-2 transition hover:bg-muted">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.cover.thumb} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-soft">
                        <Newspaper className="size-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        {fresh && <span className="size-2 rounded-full bg-destructive" />}
                        {item.type.label}
                        {item.published_at && <> · {formatDate(item.published_at, locale)}</>}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-sm font-semibold leading-snug">{item.title}</span>
                    </span>
                  </Link>
                );
              })
            )
          ) : !signedIn ? (
            <div className="grid place-items-center px-4 py-8 text-center">
              <MessageCircle className="size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">{n.loginHint}</p>
              <Link prefetch={false} onClick={() => setOpen(false)} href={routes.login} className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-brand-hover">
                {t.header.login}
              </Link>
            </div>
          ) : !notices?.data.length ? (
            <Empty text={n.emptyMessages} />
          ) : (
            notices.data.map((item) => (
              <Link prefetch={false}
                key={item.id}
                href={item.order_number ? routes.accountOrder(item.order_number) : routes.accountNotifications}
                onClick={() => {
                  if (!item.is_read) markRead(item.id);
                  setOpen(false);
                }}
                className={cn("flex gap-3 rounded-xl p-2.5 transition hover:bg-muted", !item.is_read && "bg-brand-soft/60")}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.is_read ? "bg-border" : "bg-primary")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.title}</span>
                  {item.text && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.text}</span>}
                  <span className="mt-1 block text-[11px] text-muted-foreground">{formatDate(item.created_at, locale)}</span>
                </span>
              </Link>
            ))
          )}
        </div>

        <Link prefetch={false}
          onClick={() => setOpen(false)}
          href={tab === "news" ? routes.news : signedIn ? routes.accountNotifications : routes.login}
          className="block border-t border-border px-4 py-3 text-center text-sm font-semibold transition hover:bg-muted"
        >
          {tab === "news" ? n.allNews : n.allMessages}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center px-4 py-10 text-center">
      <Bell className="size-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
