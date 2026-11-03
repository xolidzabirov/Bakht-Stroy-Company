import { type NextRequest, NextResponse } from "next/server";
import { applyRenewal, renewSession } from "@/shared/api/bff";
import { safeNext } from "@/shared/config/auth";

/**
 * GET /api/auth/refresh?next=/account — for pages that found their token no longer works (a page cannot set cookies):
 * back to the page with a new token, or to the login page when the session has really ended.
 */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"), "/");
  const renewal = await renewSession(request);

  if (renewal.status === "renewed") return applyRenewal(NextResponse.redirect(new URL(next, request.url)), renewal);

  // The API is not answering: the session may be fine, so it is kept. Public pages work without the API.
  if (renewal.status === "unavailable") return NextResponse.redirect(new URL("/", request.url));

  const login = new URL("/login", request.url);
  if (next !== "/") login.searchParams.set("next", next);

  return applyRenewal(NextResponse.redirect(login), renewal);
}
