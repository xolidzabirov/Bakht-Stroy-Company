"use client";

import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useFavoriteIds, useToggleFavorite } from "@/entities/favorite/api/useFavorites";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useSessionName } from "@/shared/lib/useSession";

/**
 * Heart on a product card / product page. Guests go to the login page; for users it toggles at once
 * (optimistic) and rolls back if the server says no.
 */
export function FavoriteButton({ productId, className, withLabel = false }: { productId: number; className?: string; withLabel?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = useSessionName() !== null;
  const { data: ids } = useFavoriteIds(signedIn);
  const toggle = useToggleFavorite();
  const active = Boolean(ids?.includes(productId));
  const label = active ? t.favorites.remove : t.favorites.add;

  const onClick = (event: React.MouseEvent) => {
    // The heart sits on top of a card link — do not open the product.
    event.preventDefault();
    event.stopPropagation();

    if (!signedIn) {
      router.push(`${routes.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    toggle.mutate(
      { productId, favorite: !active },
      {
        onSuccess: () => toast.success(active ? t.favorites.removed : t.favorites.added),
        onError: () => toast.error(t.errors.generic),
      },
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition active:scale-90",
        withLabel ? "h-11 border border-border bg-surface px-4 text-sm font-semibold hover:border-foreground/40" : "size-9 bg-surface/90 shadow-sm backdrop-blur hover:bg-surface",
        className,
      )}
    >
      <Heart className={cn("size-[18px] transition", active ? "fill-danger text-danger" : "text-foreground")} />
      {withLabel && label}
    </button>
  );
}
