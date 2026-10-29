import type { Metadata } from "next";
import { NewsForm } from "@/features/admin-news/ui/NewsForm";
import { requireStaff } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.news.newTitle };
}

/** A new post; the cover and gallery are added on its edit page right after saving. */
export default async function AdminNewNewsPage() {
  await requireStaff(routes.adminNewsNew);
  const { t } = await getI18n();
  const n = t.admin.news;

  return (
    <div>
      <PageHeader back={{ href: routes.adminNews, label: n.back }} title={n.newTitle} />
      <NewsForm />
    </div>
  );
}
