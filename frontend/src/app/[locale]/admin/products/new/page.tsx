import type { Metadata } from "next";
import { ImagePlus } from "lucide-react";
import { flattenCategories } from "@/features/admin-products/lib/categories";
import { ProductForm } from "@/features/admin-products/ui/ProductForm";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.product.newTitle };
}

/** A new product; photos are added on its edit page right after saving. */
export default async function AdminNewProductPage() {
  await requireStaff(routes.adminProductNew);
  const [{ t }, { data: tree }] = await Promise.all([getI18n(), userFetch<{ data: Category[] }>("/admin/categories")]);
  const p = t.admin.product;

  return (
    <div>
      <PageHeader back={{ href: routes.adminProducts, label: p.back }} title={p.newTitle} />
      <ProductForm
        categories={flattenCategories(tree)}
        aside={
          <p className="flex gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <ImagePlus className="size-5 shrink-0" />
            {p.photosAfterSave}
          </p>
        }
      />
    </div>
  );
}
