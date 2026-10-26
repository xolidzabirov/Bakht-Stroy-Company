"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { passwordRules } from "../model/schemas";

const colors = ["bg-border", "bg-danger", "bg-amber-500", "bg-brand", "bg-success"];

/**
 * Soft password meter: a bar and a checklist that turns green as you type — no red errors while typing.
 */
export function PasswordStrength({ value }: { value: string }) {
  const { t } = useI18n();
  const passed = passwordRules.map((rule) => rule.test(value));
  // Length, letters, digits give up to 3; a symbol or 12+ characters adds the 4th. Shorter than 8 is always "weak".
  const base = passed.slice(0, 3).filter(Boolean).length + (passed[3] || value.length >= 12 ? 1 : 0);
  const score = !value ? 0 : passed[0] ? Math.min(4, base) : 1;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={cn("h-1.5 rounded-full transition-colors", step <= score ? colors[score] : "bg-border")} />
          ))}
        </div>
        <span className="w-24 text-right text-xs font-semibold text-muted">{t.auth.strength[score]}</span>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {passwordRules.map((rule, index) => (
          <li
            key={rule.key}
            className={cn("flex items-center gap-1.5 transition-colors", passed[index] ? "text-success" : "text-muted", "optional" in rule && "col-span-2")}
          >
            <Check className={cn("size-3.5 shrink-0", !passed[index] && "opacity-30")} />
            {t.auth.rules[rule.key]}
          </li>
        ))}
      </ul>
    </div>
  );
}
