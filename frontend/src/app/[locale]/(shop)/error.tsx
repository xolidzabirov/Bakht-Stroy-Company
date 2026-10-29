"use client";

import { ErrorScreen } from "@/shared/ui/ErrorScreen";

/** A shop page failed: the header and footer stay, the page offers to retry, go home or call. */
export default function ShopError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} />;
}
