import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { passwordRules } from "../model/schemas";

const levels = [
  { label: "", color: "bg-border" },
  { label: "Слабый", color: "bg-danger" },
  { label: "Нормальный", color: "bg-amber-500" },
  { label: "Хороший", color: "bg-brand" },
  { label: "Отличный", color: "bg-success" },
];

/**
 * Soft password meter: a bar and a checklist that turns green as you type — no red errors while typing.
 */
export function PasswordStrength({ value }: { value: string }) {
  const passed = passwordRules.map((rule) => rule.test(value));
  // Length, letters, digits give up to 3; a symbol or 12+ characters adds the 4th. Shorter than 8 is always "weak".
  const base = passed.slice(0, 3).filter(Boolean).length + (passed[3] || value.length >= 12 ? 1 : 0);
  const score = !value ? 0 : passed[0] ? Math.min(4, base) : 1;
  const level = levels[score];

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={cn("h-1.5 rounded-full transition-colors", step <= score ? level.color : "bg-border")} />
          ))}
        </div>
        <span className="w-20 text-right text-xs font-semibold text-muted">{level.label}</span>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {passwordRules.map((rule, index) => (
          <li key={rule.label} className={cn("flex items-center gap-1.5 transition-colors", passed[index] ? "text-success" : "text-muted", rule.optional && "col-span-2")}>
            <Check className={cn("size-3.5 shrink-0", !passed[index] && "opacity-30")} />
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
