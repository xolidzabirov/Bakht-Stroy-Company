import { ShopPageSkeleton } from "@/shared/ui/PageSkeletons";

/** Any shop page without its own skeleton: heading and cards, shown at once while the data loads. */
export default function ShopLoading() {
  return <ShopPageSkeleton />;
}
