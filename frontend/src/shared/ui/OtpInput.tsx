"use client";

import { useRef } from "react";
import { cn } from "@/shared/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  label: string;
};

/**
 * One-time code in separate cells: typing moves forward, Backspace moves back, a pasted code fills all cells.
 */
export function OtpInput({ value, onChange, onComplete, length = 6, invalid, disabled, label }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const update = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const focus = (index: number) => refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();

  return (
    <div role="group" aria-label={label} className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          aria-label={`${label} ${index + 1}`}
          aria-invalid={invalid}
          autoFocus={index === 0}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const typed = event.target.value.replace(/\D/g, "");
            if (!typed) return;
            // A whole code pasted or auto-filled into one cell.
            if (typed.length > 1) {
              update(typed);
              focus(typed.length);
              return;
            }
            const next = digits.slice();
            next[index] = typed;
            update(next.join(""));
            focus(index + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              const next = digits.slice();
              if (next[index]) next[index] = "";
              else if (index > 0) next[index - 1] = "";
              onChange(next.join(""));
              if (!digits[index]) focus(index - 1);
            }
            if (event.key === "ArrowLeft") focus(index - 1);
            if (event.key === "ArrowRight") focus(index + 1);
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
            if (pasted) {
              update(pasted);
              focus(pasted.length);
            }
          }}
          className={cn(
            "aspect-square w-full rounded-xl border border-input bg-surface text-center font-display text-2xl font-extrabold outline-none transition",
            "focus:border-primary focus:ring-[3px] focus:ring-primary/30 disabled:opacity-60",
            digit && "border-foreground/30",
            invalid && "border-destructive focus:border-destructive focus:ring-destructive/20",
          )}
        />
      ))}
    </div>
  );
}
