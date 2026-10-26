import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Page width: full width with side gutters on phones and tablets, 90% of the screen on desktops
 * (up to 1760px on very wide monitors).
 */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6 lg:w-[90%] lg:max-w-[1760px] lg:px-0", className)}>{children}</div>;
}
