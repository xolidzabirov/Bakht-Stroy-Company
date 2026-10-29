import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { SectionNotFound } from "@/shared/ui/SectionNotFound";

/** An order, product, user or post that does not exist — inside the admin panel, not the shop 404. */
export default async function AdminNotFound() {
  const { t } = await getI18n();

  return <SectionNotFound href={routes.admin} label={t.serverError.toDashboard} />;
}
