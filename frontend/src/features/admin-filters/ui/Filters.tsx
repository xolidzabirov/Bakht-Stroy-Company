"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";
import { useQueryParams } from "@/shared/lib/useQueryParams";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";

const ALL = "__all";

/** Search box that updates ?search= half a second after typing stops. */
export function SearchFilter({ placeholder, name = "search" }: { placeholder: string; name?: string }) {
  const { params, set, pending } = useQueryParams();
  const [value, setValue] = useState(params.get(name) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const change = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => set({ [name]: next.trim() || null }), 500);
  };

  return (
    <label className="relative block min-w-56 flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => change(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {pending && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
    </label>
  );
}

/** Drop-down filter bound to one query parameter; "Все" removes it. */
export function SelectFilter({ name, label, options, allLabel }: { name: string; label: string; options: { value: string; label: string }[]; allLabel?: string }) {
  const { t } = useI18n();
  const { params, set } = useQueryParams();

  return (
    <Select value={params.get(name) ?? ALL} onValueChange={(value) => set({ [name]: value === ALL ? null : value })}>
      <SelectTrigger aria-label={label} className="h-10 min-w-40 rounded-xl bg-surface">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>
          {label}: {allLabel ?? t.admin.common.all}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Pill tabs bound to one query parameter (first tab = no value). */
export function TabFilter({ name, tabs }: { name: string; tabs: { value: string | null; label: string; count?: number }[] }) {
  const { params, set } = useQueryParams();
  const current = params.get(name);

  return (
    <div role="tablist" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {tabs.map((tab) => {
        const active = (tab.value ?? null) === current;
        return (
          <button
            key={tab.value ?? "all"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => set({ [name]: tab.value })}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
              active ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink" : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className={cn("text-xs", active ? "opacity-80" : "text-muted-foreground")}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Date input bound to one query parameter. */
export function DateFilter({ name, label }: { name: string; label: string }) {
  const { params, set } = useQueryParams();

  return (
    <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input type="date" value={params.get(name) ?? ""} onChange={(event) => set({ [name]: event.target.value || null })} className="bg-transparent outline-none" />
    </label>
  );
}

/** "Сбросить" — clears every filter of the page (shown only while something is set). */
export function ResetFilters() {
  const { t } = useI18n();
  const { params, set } = useQueryParams();
  const keys = Array.from(params.keys()).filter((key) => key !== "page");

  if (keys.length === 0) return null;

  return (
    <button type="button" onClick={() => set(Object.fromEntries(keys.map((key) => [key, null])))} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
      <X className="size-4" />
      {t.admin.common.reset}
    </button>
  );
}
