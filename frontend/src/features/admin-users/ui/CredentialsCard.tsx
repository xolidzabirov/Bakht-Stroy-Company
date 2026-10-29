"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, MessageCircle } from "lucide-react";
import { env } from "@/shared/config/env";
import { routes } from "@/shared/config/site";
import { useI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { Button, buttonClasses } from "@/shared/ui";

export type Credentials = { login: string; password: string };

/**
 * Login and password of a new account (or a reset one), shown once: copy each value,
 * copy a ready message, or send it straight to the person's WhatsApp.
 */
export function CredentialsCard({ credentials, phone }: { credentials: Credentials; phone?: string | null }) {
  const { t } = useI18n();
  const c = t.admin.credentials;
  const [copied, setCopied] = useState<string | null>(null);
  const message = fmt(c.message, { url: `${env.siteUrl}${routes.login}`, login: credentials.login, password: credentials.password });

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
    } catch {
      // Clipboard blocked by the browser — the values stay on screen to copy by hand.
    }
  };

  const rows = [
    { key: "login", label: c.login, value: credentials.login, mono: false },
    { key: "password", label: c.password, value: credentials.password, mono: true },
  ];

  return (
    <div className="rounded-2xl border border-brand/50 bg-brand-soft/40 p-4">
      <p className="flex items-start gap-2 text-sm font-semibold">
        <KeyRound className="mt-0.5 size-4 shrink-0" />
        {c.once}
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2">
            <dt className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.label}</dt>
            <dd className={row.mono ? "min-w-0 flex-1 select-all break-all font-mono text-base font-bold tracking-wider" : "min-w-0 flex-1 select-all break-all font-semibold"}>{row.value}</dd>
            <button
              type="button"
              onClick={() => void copy(row.key, row.value)}
              aria-label={`${c.copy}: ${row.label}`}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {copied === row.key ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </button>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void copy("message", message)}>
          {copied === "message" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "message" ? c.copied : c.copyMessage}
        </Button>
        {phone && (
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            <MessageCircle className="size-4" />
            {c.whatsapp}
          </a>
        )}
      </div>
    </div>
  );
}
