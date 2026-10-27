import type { Metadata } from "next";
import { NotificationList } from "@/features/notifications/ui/NotificationList";
import { userFetch } from "@/shared/api/session";
import type { AppNotification } from "@/shared/api/types";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.acc.notifications.title, robots: { index: false } };
}

export default async function AccountNotificationsPage() {
  const result = await userFetch<{ data: AppNotification[]; meta: { unread_count: number } }>("/me/notifications?per_page=50");

  return <NotificationList items={result.data} unread={result.meta.unread_count} />;
}
