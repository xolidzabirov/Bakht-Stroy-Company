import { Check, X } from "lucide-react";
import type { Order } from "@/shared/api/types";
import { getI18n } from "@/shared/i18n/server";
import { cn } from "@/shared/lib/cn";

const FLOW = ["new", "confirmed", "assembling", "delivering", "completed"] as const;

const tones: Record<string, string> = {
  new: "bg-brand-soft text-foreground",
  confirmed: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  assembling: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  delivering: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Order status as a colored pill. */
export function OrderStatusBadge({ status, className }: { status: Order["status"]; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[status.value] ?? "bg-muted", className)}>{status.label}</span>;
}

/** Payment status: waiting (yellow) or paid (green). */
export function PaymentBadge({ status }: { status: Order["payment_status"] }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", status.value === "paid" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
      {status.label}
    </span>
  );
}

/**
 * New → Confirmed → Packing → On the way → Completed; the current step is highlighted, a cancelled order says so.
 */
export async function OrderProgress({ status }: { status: Order["status"] }) {
  const { t } = await getI18n();

  if (status.value === "cancelled") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 p-4 font-semibold text-destructive">
        <X className="size-5" />
        {t.acc.order.cancelledTitle}
      </p>
    );
  }

  const current = FLOW.indexOf(status.value as (typeof FLOW)[number]);

  return (
    <ol className="grid grid-cols-5 gap-1">
      {FLOW.map((step, index) => {
        const done = index < current || status.value === "completed";
        const active = index === current && status.value !== "completed";

        return (
          <li key={step} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-1 flex-1 rounded-full", index === 0 ? "invisible" : index <= current ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-surface text-foreground ring-4 ring-primary/20",
                  !done && !active && "border-border bg-surface text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span className={cn("h-1 flex-1 rounded-full", index === FLOW.length - 1 ? "invisible" : index < current ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("mt-2 text-[11px] font-semibold leading-tight sm:text-xs", done || active ? "text-foreground" : "text-muted-foreground")}>{t.acc.order.steps[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}
