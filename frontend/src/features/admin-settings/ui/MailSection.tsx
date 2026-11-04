"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleCheck, LoaderCircle, Mail, TriangleAlert } from "lucide-react";
import { ApiError } from "@/shared/api/http";
import { bff } from "@/shared/api/client";
import { useAdminI18n } from "@/shared/i18n/client";
import { fmt } from "@/shared/i18n/format";
import { Button, buttonClasses } from "@/shared/ui";
import { SettingRow, SettingsList, SettingsSection } from "@/shared/ui/admin/Settings";

export type MailStatus = { configured: boolean; connected: boolean; email: string | null; broken: boolean; active: boolean };

/**
 * The Gmail mailbox that sends the shop's codes and letters: connected once here, on Google's page,
 * with a test letter to see that it really works. The token never reaches the browser.
 */
export function MailSection({ status, result }: { status: MailStatus; result?: string }) {
  const { t } = useAdminI18n();
  const s = t.admin.settings;
  const c = t.admin.common;
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // The answer of Google's page came in the address: say it once and clean the address.
  useEffect(() => {
    if (result === "connected") toast.success(s.mailJustConnected);
    if (result === "failed") toast.error(s.mailConnectFailed);
    if (result) router.replace(pathname, { scroll: false });
  }, [result, pathname, router, s.mailJustConnected, s.mailConnectFailed]);

  const sendTest = async () => {
    setBusy(true);
    try {
      const { data } = await bff<{ data: { sent_to: string } }>("/api/proxy/admin/mail/test");
      toast.success(fmt(s.mailTestSent, { email: data.sent_to }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await bff("/api/proxy/admin/mail/google", { method: "DELETE" });
      toast.success(s.mailDisconnected);
      setConfirming(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  const connect = (label: string) => (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- a full trip to Google and back, not a page of the site
    <a href="/api/auth/google?purpose=gmail" className={buttonClasses({ size: "sm" })}>
      <Mail className="size-4" />
      {label}
    </a>
  );
  const warning = (text: string) => (
    <p className="mb-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      {text}
    </p>
  );

  return (
    <SettingsSection id="store-mail" title={s.mail} description={s.mailText} className="mt-5">
      <div className="pb-3">
        {!status.configured ? (
          <p className="text-sm text-muted-foreground">{s.mailNotConfigured}</p>
        ) : !status.connected ? (
          <div className="space-y-3">
            {warning(s.mailNotConnected)}
            {connect(s.mailConnect)}
          </div>
        ) : (
          <>
            {status.broken && warning(s.mailBroken)}
            {!status.active && warning(s.mailInactive)}
            <SettingsList>
              <SettingRow label={s.mailAddress}>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span className="break-all font-medium">{status.email}</span>
                  {!status.broken && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
                      <CircleCheck className="size-3.5" />
                      {s.mailConnected}
                    </span>
                  )}
                </span>
              </SettingRow>
            </SettingsList>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {status.broken ? (
                connect(s.mailReconnect)
              ) : (
                <Button type="button" size="sm" onClick={sendTest} disabled={busy}>
                  {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  {s.mailTest}
                </Button>
              )}
              {confirming ? (
                <>
                  <span className="text-sm text-muted-foreground">{s.mailDisconnectConfirm}</span>
                  <Button type="button" size="sm" variant="outline" onClick={disconnect} disabled={busy} className="text-destructive hover:text-destructive">
                    {s.mailDisconnect}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
                    {c.cancel}
                  </Button>
                </>
              ) : (
                <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)} disabled={busy}>
                  {s.mailDisconnect}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </SettingsSection>
  );
}
