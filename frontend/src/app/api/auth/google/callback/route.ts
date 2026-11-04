import { type NextRequest, NextResponse } from "next/server";
import { applyRenewal, callBackend, deviceName, googleRedirectUri } from "@/shared/api/bff";
import { GOOGLE_STATE_COOKIE, safeNext } from "@/shared/config/auth";

type Saved = { state: string; next: string; gmail: boolean };

function readSaved(request: NextRequest): Saved | null {
  try {
    const saved = JSON.parse(request.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "") as Partial<Saved>;

    return typeof saved.state === "string" ? { state: saved.state, next: safeNext(saved.next), gmail: Boolean(saved.gmail) } : null;
  } catch {
    return null;
  }
}

/** The answers of the API that the login page explains in its own words. */
const SIGN_IN_ERRORS: Record<string, string> = { ACCOUNT_BLOCKED: "blocked", STAFF_PASSWORD_ONLY: "staff" };

/**
 * GET /api/auth/google/callback?code=…&state=… — Google brings the person back here.
 * The code goes to the API, which alone knows the secret; the tokens become httpOnly cookies, as with a normal login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const saved = readSaved(request);
  const code = searchParams.get("code");

  const finish = (response: NextResponse) => {
    response.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });

    return response;
  };
  const go = (path: string) => finish(NextResponse.redirect(new URL(path, request.url)));

  if (!saved || saved.state !== searchParams.get("state")) return go("/login?google=failed");

  const body = JSON.stringify({ code, redirect_uri: googleRedirectUri(request), device_name: deviceName(request) });

  if (saved.gmail) {
    if (!code) return go("/admin/settings");

    const upstream = await callBackend(request, "/admin/mail/google", { method: "POST", body }).catch(() => null);

    return go(`/admin/settings?gmail=${upstream?.ok ? "connected" : "failed"}`);
  }

  // The person pressed "Отмена" on Google's page: back to the form, nothing has happened.
  if (!code) return go(`/login${saved.next === "/" ? "" : `?next=${encodeURIComponent(saved.next)}`}`);

  const upstream = await callBackend(request, "/auth/google", { method: "POST", body }).catch(() => null);

  if (!upstream) return go("/login?google=unavailable");

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok || !payload?.data) return go(`/login?google=${SIGN_IN_ERRORS[payload?.code] ?? "failed"}`);

  return finish(applyRenewal(NextResponse.redirect(new URL(saved.next, request.url)), { status: "renewed", data: payload.data, remember: true }));
}
