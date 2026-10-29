import type { Metadata } from "next";
import { StoreSettingsForm } from "@/features/admin-settings/ui/StoreSettingsForm";
import { requireAdmin } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { StoreSettings } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.settings.title };
}

/** Store contacts, social links, delivery and payment details (administrator only). */
export default async function AdminSettingsPage() {
  await requireAdmin(routes.adminSettings);
  const [{ t }, { data: settings }] = await Promise.all([getI18n(), userFetch<{ data: StoreSettings }>("/admin/settings")]);

  return (
    <div className="max-w-4xl">
      <PageHeader title={t.admin.settings.title} description={t.admin.settings.lead} />
      <StoreSettingsForm settings={settings} />
    </div>
  );
}
