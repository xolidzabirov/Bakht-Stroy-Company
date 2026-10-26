import { type NextRequest, NextResponse } from "next/server";
import { callBackend, clearSession } from "@/shared/api/bff";
import { AUTH_COOKIE, safeNext } from "@/shared/config/auth";

/**
 * POST /api/auth/logout — revokes the token on the backend and clears the cookies.
 * The cookies are cleared even if the API does not answer.
 */
export async function POST(request: NextRequest) {
  if (request.cookies.has(AUTH_COOKIE)) {
    await callBackend(request, "/auth/logout", { method: "POST" }).catch(() => null);
  }

  return clearSession(new NextResponse(null, { status: 204 }));
}

/**
 * GET /api/auth/logout?next=/account — for pages that found an expired token: forget it and go to the login page
 * (otherwise proxy.ts would keep sending the "signed-in" visitor away from /login).
 */
export function GET(request: NextRequest) {
  const login = new URL("/login", request.url);
  const next = safeNext(request.nextUrl.searchParams.get("next"), "");

  if (next) login.searchParams.set("next", next);

  return clearSession(NextResponse.redirect(login));
}
