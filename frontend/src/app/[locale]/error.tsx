"use client";

import { ErrorScreen } from "@/shared/ui/ErrorScreen";

/** A section layout itself failed (e.g. the shop header data): the whole screen. */
export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} fullScreen />;
}
