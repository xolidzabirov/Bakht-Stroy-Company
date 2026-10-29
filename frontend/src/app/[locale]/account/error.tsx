"use client";

import { ErrorScreen } from "@/shared/ui/ErrorScreen";

/** An account section failed: the account menu stays, "back" leads to the overview. */
export default function AccountError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} variant="account" />;
}
