import Link from "next/link";
import { preconnect } from "react-dom";
import type { Product } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { fmt } from "@/shared/i18n/format";
import { formatMoney } from "@/shared/lib/format";
import { Badge } from "@/shared/ui";

type Props = {
  product: Product;
  /** Slot for the "add to cart" button (features/add-to-cart). */
  action?: React.ReactNode;
  /** Slot over the picture, top right (features/toggle-favorite). */
  favorite?: React.ReactNode;
  /** The first cards of a page: load the photo at once instead of lazily (it is the largest thing on screen). */
  priority?: boolean;
};

export async function ProductCard({ product, action, favorite, priority = false }: Props) {
  const { t, locale } = await getI18n();
  const image = product.image;

  // Photos live on another server: the connection opens before the first of them is needed.
  if (image) preconnect(new URL(image.card).origin);

  return (
    <article className="lazy-render group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface card-hover">
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- ready WebP sizes from the backend; a plain tag costs the browser no script
          <img
            src={image.card}
            srcSet={`${image.thumb} 300w, ${image.card} 600w`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discount_percent ? <Badge tone="danger" className="bg-danger text-white">−{product.discount_percent}%</Badge> : null}
          {product.is_featured && <Badge>{t.common.hit}</Badge>}
        </div>
      </div>
      {favorite && <div className="absolute right-3 top-3 z-10">{favorite}</div>}

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <p className="mb-1 text-xs text-muted-foreground">{product.category.name}</p>
        )}
        {/* One link for the whole card (it stretches over it): the buttons below sit above it. */}
        <Link prefetch={false} href={routes.product(product.slug)} className="line-clamp-2 min-h-[2.75rem] font-semibold leading-snug after:absolute after:inset-0 hover:underline">
          {product.name}
        </Link>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold tabular-nums">{formatMoney(product.price, locale)}</span>
            {product.old_price ? <span className="text-sm text-muted-foreground line-through">{formatMoney(product.old_price, locale)}</span> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {fmt(t.common.perUnit, { unit: product.unit.label })}
            {product.min_order_qty > 1 && ` · ${fmt(t.common.fromQty, { qty: product.min_order_qty, unit: product.unit.label })}`}
          </p>
          <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${product.in_stock ? "text-success" : "text-danger"}`}>
            <span aria-hidden className={`size-1.5 rounded-full ${product.in_stock ? "bg-success" : "bg-danger"}`} />
            {product.in_stock ? t.common.inStock : t.common.outOfStock}
          </p>
          {action && <div className="relative z-10 mt-3">{action}</div>}
        </div>
      </div>
    </article>
  );
}
