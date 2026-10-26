import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type Tone = "brand" | "dark" | "success" | "danger" | "muted";

const tones: Record<Tone, string> = {
  brand: "bg-brand text-ink",
  dark: "bg-ink text-white",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  muted: "bg-surface-muted text-muted",
};

export function Badge({ tone = "brand", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}
