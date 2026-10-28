import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Eye } from "lucide-react";
import { DeleteNews } from "@/features/admin-news/ui/DeleteNews";
import { NewsForm } from "@/features/admin-news/ui/NewsForm";
import { NewsMedia } from "@/features/admin-news/ui/NewsMedia";
import { ApiError } from "@/shared/api/http";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminNews } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.news.editTitle };
}

async function loadNews(id: number): Promise<AdminNews> {
  try {
    return (await userFetch<{ data: AdminNews }>(`/admin/news/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** Edit a post: text and settings on the left, publishing, products, cover and gallery on the right. */
export default async function AdminEditNewsPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  await requireStaff(routes.adminNewsEdit(id));
  const [{ t }, news] = await Promise.all([getI18n(), loadNews(id)]);
  const n = t.admin.news;

  return (
    <div>
      <PageHeader
        back={{ href: routes.adminNews, label: n.back }}
        title={news.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{n.statuses[news.status] ?? news.status}</span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" />
              {fmt(n.views, { count: String(news.views_count) })}
            </span>
            {news.status === "published" && (
              <Link href={routes.newsItem(news.slug)} target="_blank" className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline">
                <ExternalLink className="size-4" />
                {n.openOnSite}
              </Link>
            )}
          </span>
        }
        actions={<DeleteNews newsId={news.id} title={news.title} />}
      />
      <NewsForm key={news.updated_at} news={news} aside={<NewsMedia newsId={news.id} cover={news.cover} gallery={news.gallery ?? []} />} />
    </div>
  );
}
