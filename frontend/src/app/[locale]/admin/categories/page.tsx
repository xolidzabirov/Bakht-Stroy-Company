import type { Metadata } from "next";
import { CategoryManager } from "@/features/admin-categories/ui/CategoryManager";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.categories.title };
}

/** The catalog tree, hidden categories included. */
export default async function AdminCategoriesPage() {
  await requireStaff(routes.adminCategories);
  const [{ t }, { data: tree }] = await Promise.all([getI18n(), userFetch<{ data: Category[] }>("/admin/categories")]);
  const count = tree.reduce((sum, root) => sum + 1 + (root.children?.length ?? 0), 0);

  return (
    <div>
      <PageHeader title={t.admin.categories.title} description={fmt(t.admin.common.total, { count: String(count) })} />
      <CategoryManager tree={tree} />
    </div>
  );
}
