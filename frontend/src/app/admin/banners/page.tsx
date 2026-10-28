import type { Metadata } from "next";
import { BannerManager } from "@/features/admin-banners/ui/BannerManager";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Banner } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.banners.title };
}

/** Home page slides, hidden and scheduled ones too. */
export default async function AdminBannersPage() {
  await requireStaff(routes.adminBanners);
  const [{ t }, { data: banners }] = await Promise.all([getI18n(), userFetch<{ data: Banner[] }>("/admin/banners")]);

  return (
    <div className="max-w-5xl">
      <PageHeader title={t.admin.banners.title} description={t.admin.banners.lead} />
      <BannerManager banners={banners} />
    </div>
  );
}
