"use client";

import { useId, useState } from "react";
import type { Locale } from "@/shared/i18n/config";
import { cn } from "@/shared/lib/cn";
import { formatMoney } from "@/shared/lib/format";

type Point = { label: string; value: number };

/** 0, 1, 2, 2.5, 5 × 10ⁿ — a clean top for the axis. */
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= max) ?? 10;
  return step * power;
}

/** 0 / 1,5K / 12K — compact tick labels. */
function compact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/**
 * One series by day as thin columns (dataviz specs: ≤ 24px, 4px rounded top, square at the baseline,
 * hairline grid, a tooltip on hover / focus, a table view below). The title names the series, so no legend.
 */
export function ColumnChart({
  title,
  points,
  kind,
  locale,
  tableLabels,
}: {
  title: string;
  points: Point[];
  /** money: values in dirams, shown in somoni. */
  kind: "count" | "money";
  locale: Locale;
  tableLabels: { date: string; value: string; show: string };
}) {
  const [active, setActive] = useState<number | null>(null);
  const format = (value: number) => (kind === "money" ? formatMoney(value, locale) : String(value));
  const tick = (value: number) => compact(kind === "money" ? value / 100 : value, locale);
  const tableId = useId();
  const max = niceMax(Math.max(...points.map((p) => p.value), 0));
  const ticks = [max, max / 2, 0];
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const shown = active !== null ? points[active] : null;

  return (
    <figure className="min-w-0">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-sm font-semibold text-muted-foreground">{format(total)}</span>
      </figcaption>

      <div className="relative flex h-44 gap-2">
        <div className="flex w-9 shrink-0 flex-col justify-between pb-5 text-right text-[11px] tabular-nums text-muted-foreground" aria-hidden>
          {ticks.map((value) => (
            <span key={value} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {tick(value)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* hairline grid: top, middle, baseline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between" aria-hidden>
            <span className="h-px bg-border" />
            <span className="h-px bg-border" />
            <span className="h-px bg-border" />
          </div>

          <div className="absolute inset-x-0 top-0 bottom-5 flex items-end gap-[2px]" role="group" aria-label={title} onMouseLeave={() => setActive(null)}>
            {points.map((point, index) => (
              <button
                key={point.label}
                type="button"
                aria-label={`${point.label}: ${format(point.value)}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className="group flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              >
                <span
                  className={cn("block w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity", active !== null && active !== index && "opacity-40")}
                  style={{ height: point.value > 0 ? `max(2px, ${(point.value / max) * 100}%)` : 0 }}
                />
              </button>
            ))}
          </div>

          {/* first and last date under the baseline */}
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-muted-foreground" aria-hidden>
            <span>{points[0]?.label}</span>
            <span>{points.at(-1)?.label}</span>
          </div>

          {shown && active !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
              style={{ left: `${((active + 0.5) / points.length) * 100}%` }}
            >
              <span className="block text-muted-foreground">{shown.label}</span>
              <b className="text-sm">{format(shown.value)}</b>
            </div>
          )}
        </div>
      </div>

      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-foreground" aria-controls={tableId}>
          {tableLabels.show}
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border">
          <table id={tableId} className="w-full text-left">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-3 py-1.5 font-semibold">{tableLabels.date}</th>
                <th className="px-3 py-1.5 text-right font-semibold">{tableLabels.value}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.label} className="border-t border-border">
                  <td className="px-3 py-1">{point.label}</td>
                  <td className="px-3 py-1 text-right tabular-nums text-foreground">{format(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
