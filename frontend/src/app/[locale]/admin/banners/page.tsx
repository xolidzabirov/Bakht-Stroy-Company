import type { Metadata } from "next";
import Link from "next/link";
import { Camera, GalleryHorizontalEnd, Images, RectangleHorizontal } from "lucide-react";
import { BannerManager } from "@/features/admin-banners/ui/BannerManager";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Banner } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.banners.title };
}

type Placement = "hero" | "promo" | "works";

/**
 * The home page carousels, hidden and scheduled slides too: the main slider of the first screen (opens first),
 * the banners strip under it and the photos of the company's work.
 */
export default async function AdminBannersPage({ searchParams }: { searchParams: Promise<{ placement?: string }> }) {
  await requireStaff(routes.adminBanners);
  const asked = (await searchParams).placement;
  const placement: Placement = asked === "promo" || asked === "works" ? asked : "hero";
  const [{ t }, { data: banners }] = await Promise.all([getI18n(), userFetch<{ data: Banner[] }>(`/admin/banners?placement=${placement}`)]);
  const b = t.admin.banners;
  const tabs = [
    { value: "hero" as const, label: b.tabs.hero, icon: Images },
    { value: "promo" as const, label: b.tabs.promo, icon: RectangleHorizontal },
    { value: "works" as const, label: b.tabs.works, icon: Camera },
  ];

  return (
    <div>
      <PageHeader icon={GalleryHorizontalEnd} title={b.title} description={placement === "hero" ? b.heroLead : placement === "works" ? b.worksLead : b.lead} />

      <nav aria-label={b.title} className="mb-5 inline-flex max-w-full flex-wrap rounded-xl border border-border bg-surface p-1">
        {tabs.map(({ value, label, icon: Icon }) => (
          <Link
            key={value}
            href={value === "hero" ? routes.adminBanners : `${routes.adminBanners}?placement=${value}`}
            aria-current={placement === value ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition",
              placement === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <BannerManager key={placement} banners={banners} placement={placement} />
    </div>
  );
}
