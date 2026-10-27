import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, ExternalLink } from "lucide-react";
import { flattenCategories } from "@/features/admin-products/lib/categories";
import { ProductForm } from "@/features/admin-products/ui/ProductForm";
import { ProductImages } from "@/features/admin-products/ui/ProductImages";
import { DeleteProduct } from "@/features/admin-products/ui/ProductRowActions";
import { ApiError } from "@/shared/api/http";
import { requireStaff } from "@/shared/api/requireUser";
import { userFetch } from "@/shared/api/session";
import type { AdminProduct, Category } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { fmt } from "@/shared/i18n/format";
import { getI18n } from "@/shared/i18n/server";
import { PageHeader } from "@/widgets/admin-shell/ui/PageHeader";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.admin.product.editTitle };
}

async function loadProduct(id: number): Promise<AdminProduct> {
  try {
    return (await userFetch<{ data: AdminProduct }>(`/admin/products/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** Edit a product: form on the left, photos, statistics and delete on the right. */
export default async function AdminProductPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();

  await requireStaff(routes.adminProduct(id));
  const [{ t }, product, { data: tree }] = await Promise.all([getI18n(), loadProduct(id), userFetch<{ data: Category[] }>("/admin/categories")]);
  const p = t.admin.product;

  return (
    <div>
      <PageHeader
        back={{ href: routes.adminProducts, label: p.back }}
        title={product.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" />
              {fmt(p.views, { count: String(product.views_count) })}
            </span>
            {product.is_active && (
              <Link href={routes.product(product.slug)} target="_blank" className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline">
                <ExternalLink className="size-4" />
                {p.openOnSite}
              </Link>
            )}
          </span>
        }
        actions={<DeleteProduct productId={product.id} name={product.name} afterDelete={routes.adminProducts} compact={false} />}
      />

      <ProductForm key={product.updated_at} product={product} categories={flattenCategories(tree)} aside={<ProductImages productId={product.id} images={product.images ?? []} />} />
    </div>
  );
}
