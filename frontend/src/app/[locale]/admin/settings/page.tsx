import type { Metadata } from "next";
import { MailSection, type MailStatus } from "@/features/admin-settings/ui/MailSection";
import { StoreSettingsForm } from "@/features/admin-settings/ui/StoreSettingsForm";
import { SlidersHorizontal } from "lucide-react";
import { requireAdmin } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { StoreSettings } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.settings.title };
}

/** Store contacts, social links, delivery and payment details, and the mailbox that sends the letters (administrator only). */
export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  await requireAdmin(routes.adminSettings);
  const [{ t }, { data: settings }, { data: mail }, { gmail }] = await Promise.all([
    getI18n(),
    userFetch<{ data: StoreSettings }>("/admin/settings"),
    userFetch<{ data: MailStatus }>("/admin/mail"),
    searchParams,
  ]);

  return (
    <div>
      <PageHeader icon={SlidersHorizontal} title={t.admin.settings.title} description={t.admin.settings.lead} />
      <StoreSettingsForm settings={settings} />
      <MailSection status={mail} result={gmail} />
    </div>
  );
}
