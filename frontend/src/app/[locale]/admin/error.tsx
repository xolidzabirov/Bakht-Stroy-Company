"use client";

import { ErrorScreen } from "@/shared/ui/ErrorScreen";

/** An admin section failed: the dark menu stays, "back" leads to the dashboard. */
export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} variant="admin" />;
}
