"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  labels: { quantity: string; decrease: string; increase: string };
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
};

/**
 * − [ 10 ] + : buttons and a typed number, kept between min (minimum order) and max (stock).
 */
export function QuantityStepper({ value, min = 1, max = Number.MAX_SAFE_INTEGER, onChange, labels, size = "md", disabled, className }: Props) {
  // What is typed right now; null — show the value from the props.
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));

  const commit = () => {
    if (draft === null) return;
    const number = Number(draft);
    onChange(Number.isFinite(number) && draft !== "" ? clamp(number) : value);
    setDraft(null);
  };

  const button = cn(
    "grid shrink-0 place-items-center rounded-lg text-foreground transition hover:bg-surface disabled:pointer-events-none disabled:opacity-40",
    size === "sm" ? "size-8" : "size-10",
  );

  return (
    <div className={cn("inline-flex items-center rounded-xl bg-muted p-1", disabled && "opacity-60", className)}>
      <button type="button" aria-label={labels.decrease} className={button} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - 1))}>
        <Minus className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={labels.quantity}
        disabled={disabled}
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(event) => event.key === "Enter" && commit()}
        className={cn("bg-transparent text-center font-semibold tabular-nums outline-none", size === "sm" ? "w-10 text-sm" : "w-14")}
      />
      <button type="button" aria-label={labels.increase} className={button} disabled={disabled || value >= max} onClick={() => onChange(clamp(value + 1))}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
