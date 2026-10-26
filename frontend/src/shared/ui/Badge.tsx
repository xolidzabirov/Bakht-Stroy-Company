import type { ReactNode } from "react";
import { Badge as KitBadge } from "./kit/badge";

type Tone = "brand" | "dark" | "success" | "danger" | "muted";

const tones = { brand: "default", dark: "dark", success: "success", danger: "destructive", muted: "secondary" } as const;

/** Small label (Хит, −9%, roles, news type) — shadcn/ui badge in the Bakht Stroy colors. */
export function Badge({ tone = "brand", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <KitBadge variant={tones[tone]} className={className}>
      {children}
    </KitBadge>
  );
}
