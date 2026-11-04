import Link from "next/link";
import { preconnect } from "react-dom";
import type { Product } from "@/shared/api/types";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { fmt } from "@/shared/i18n/format";
import { formatMoney } from "@/shared/lib/format";
import { Badge } from "@/shared/ui";
import { CardGallery } from "./CardGallery";

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
  // Only what the slider needs travels with the page.
  const images = (product.images ?? []).map(({ id, thumb, card }) => ({ id, thumb, card }));

  // Photos live on another server: the connection opens before the first of them is needed.
  if (image) preconnect(new URL(image.card).origin);

  return (
    <article className="lazy-render group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface card-hover">
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        {images.length > 1 ? (
          <CardGallery images={images} href={routes.product(product.slug)} name={product.name} priority={priority} />
        ) : image && (
          // eslint-disable-next-line @next/next/no-img-element -- ready WebP sizes from the backend; a plain tag costs the browser no script
          <img
            src={image.card}
            srcSet={`${image.thumb} 300w, ${image.card} 600w`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
          />
        )}
        <div className="pointer-events-none absolute left-3 top-3 z-[2] flex flex-col gap-1.5">
          {product.is_featured && <Badge>{t.common.hit}</Badge>}
          {product.discount_percent ? <Badge tone="danger" className="bg-danger text-white">−{product.discount_percent}%</Badge> : null}
        </div>
        <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 z-[2] h-[3px] w-full origin-left scale-x-0 bg-brand transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </div>
      {/* The heart comes on hover, and stays when the product is already in favorites. */}
      {favorite && <div className="absolute right-3 top-3 z-10 transition duration-300 can-hover:-translate-y-1 can-hover:opacity-0 focus-within:translate-y-0 focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 has-[[aria-pressed=true]]:translate-y-0 has-[[aria-pressed=true]]:opacity-100">{favorite}</div>}

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <p className="mb-1 text-xs text-muted-foreground">{product.category.name}</p>
        )}
        {/* One link for the whole card (it stretches over it): the buttons below sit above it. */}
        <Link prefetch={false} href={routes.product(product.slug)} className="line-clamp-2 min-h-[2.75rem] font-semibold leading-snug after:absolute after:inset-0">
          {product.name}
        </Link>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold tabular-nums text-success">{formatMoney(product.price, locale)}</span>
            {product.old_price ? <span className="text-sm text-danger line-through">{formatMoney(product.old_price, locale)}</span> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {fmt(t.common.perUnit, { unit: product.unit.label })}
            {product.min_order_qty > 1 && ` · ${fmt(t.common.fromQty, { qty: product.min_order_qty, unit: product.unit.label })}`}
          </p>
          <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${product.in_stock ? "text-success" : "text-danger"}`}>
            <span aria-hidden className={`size-1.5 rounded-full ${product.in_stock ? "bg-success" : "bg-danger"}`} />
            {product.in_stock ? t.common.inStock : t.common.outOfStock}
          </p>
          {action && <div className="relative z-10 mt-3 can-hover:absolute can-hover:inset-x-0 can-hover:bottom-0 can-hover:mt-0 can-hover:translate-y-full can-hover:bg-surface can-hover:px-4 can-hover:pb-3.5 can-hover:pt-2 can-hover:transition-transform can-hover:duration-300 can-hover:ease-out can-hover:focus-within:translate-y-0 can-hover:group-hover:translate-y-0">{action}</div>}
        </div>
      </div>
    </article>
  );
}
