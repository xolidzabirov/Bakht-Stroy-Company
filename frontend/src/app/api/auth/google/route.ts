import { type NextRequest, NextResponse } from "next/server";
import { callBackend, googleRedirectUri } from "@/shared/api/bff";
import { GOOGLE_STATE_COOKIE, safeNext } from "@/shared/config/auth";

/**
 * GET /api/auth/google?next=/account — "Войти через Google": sends the person to Google's page.
 * GET /api/auth/google?purpose=gmail — the administrator connects the mailbox that sends the shop's letters.
 * A random string goes along and is checked on the way back, so nobody can slip in a code of their own.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const gmail = searchParams.get("purpose") === "gmail";
  const next = safeNext(searchParams.get("next"));
  const state = crypto.randomUUID();
  const query = new URLSearchParams({ redirect_uri: googleRedirectUri(request), state });
  const failed = gmail ? "/admin/settings?gmail=failed" : "/login?google=unavailable";

  const url = await callBackend(request, `${gmail ? "/admin/mail/google/url" : "/auth/google/url"}?${query}`, { method: "GET" })
    .then(async (upstream) => (upstream.ok ? ((await upstream.json()) as { data: { url: string } }).data.url : null))
    .catch(() => null);

  if (!url) return NextResponse.redirect(new URL(failed, request.url));

  const response = NextResponse.redirect(url);

  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, next, gmail }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });

  return response;
}
