"use client";

import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

/** "931234567" → "93 123 45 67" */
export function formatLocalPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);

  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

type Props = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  /** 9 local digits (without +992). */
  value: string;
  onChange: (digits: string) => void;
};

/**
 * Tajik phone: the "+992" prefix is fixed, the person types only 9 digits (shown as 93 123 45 67).
 */
export function PhoneInput({ value, onChange, className, ...props }: Props) {
  return (
    <div
      className={cn(
        "flex h-12 w-full items-center rounded-xl border border-input bg-surface transition",
        "focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/30",
        "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20",
        className,
      )}
    >
      <span className="flex h-full items-center gap-2 border-r border-border pl-4 pr-3 font-semibold">
        <span aria-hidden className="text-base leading-none">🇹🇯</span>
        +992
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={formatLocalPhone(value)}
        onChange={(event) => {
          let digits = event.target.value.replace(/\D/g, "");
          // Pasted with the country code: "+992 93 …" or "992 93 …".
          if (digits.length > 9 && digits.startsWith("992")) digits = digits.slice(3);
          onChange(digits.slice(0, 9));
        }}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] tracking-wide outline-none placeholder:text-muted-foreground/70"
        {...props}
      />
    </div>
  );
}
