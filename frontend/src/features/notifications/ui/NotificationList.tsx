"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { bff } from "@/shared/api/client";
import type { AppNotification } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Button } from "@/shared/ui";

/**
 * Order news. Unread ones are highlighted; opening the order marks the notice as read.
 *
 * When the page opens and there are unread notifications, they are all marked as read automatically
 * so the sidebar badge and header bell counter go away. The yellow highlight stays on the page
 * until the user refreshes, so they can still see which ones were new.
 */
export function NotificationList({ items, unread }: { items: AppNotification[]; unread: number }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const n = t.acc.notifications;
  const autoMarked = useRef(false);

  // Auto-mark all as read when the page opens (runs once).
  useEffect(() => {
    if (unread > 0 && !autoMarked.current) {
      autoMarked.current = true;
      bff("/api/proxy/me/notifications/read-all")
        .then(() => {
          // Refresh the header bell counter and the sidebar badge.
          queryClient.invalidateQueries({ queryKey: ["header-notices"] });
          router.refresh();
        })
        .catch(() => null);
    }
  }, [unread, queryClient, router]);

  const readAll = () =>
    startTransition(async () => {
      try {
        await bff("/api/proxy/me/notifications/read-all");
        queryClient.invalidateQueries({ queryKey: ["header-notices"] });
        router.refresh();
      } catch {
        toast.error(t.errors.generic);
      }
    });

  const markRead = (id: string) => {
    void bff(`/api/proxy/me/notifications/${id}/read`)
      .then(() => queryClient.invalidateQueries({ queryKey: ["header-notices"] }))
      .catch(() => null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{n.title}</h1>
        {unread > 0 && (
          <Button variant="outline" onClick={readAll} disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
            {n.readAll}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Bell className="size-10 text-muted-foreground" />
          <p className="mt-4 font-bold">{n.empty}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{n.emptyText}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li key={item.id} className={cn("flex gap-4 rounded-2xl border p-4", item.is_read ? "border-border bg-surface" : "border-primary/40 bg-brand-soft")}>
              <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", item.is_read ? "bg-border" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.title}</p>
                {item.text && <p className="mt-0.5 text-sm text-muted-foreground">{item.text}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(item.created_at, locale)}</span>
                  {item.order_number && (
                    <Link href={routes.accountOrder(item.order_number)} onClick={() => !item.is_read && markRead(item.id)} className="font-semibold text-foreground hover:underline">
                      {n.openOrder} {item.order_number}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
