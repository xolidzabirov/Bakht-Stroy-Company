import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { SectionNotFound } from "@/shared/ui/SectionNotFound";

/** An order that is not the customer's or no longer exists — inside the account. */
export default async function AccountNotFound() {
  const { t } = await getI18n();

  return <SectionNotFound href={routes.account} label={t.serverError.toAccount} />;
}
