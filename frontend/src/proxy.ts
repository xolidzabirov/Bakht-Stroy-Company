import { type NextRequest, NextResponse } from "next/server";
import { applyRenewal, canRenew, isRenewalDue, type Renewal, renewSession } from "@/shared/api/bff";
import { AUTH_COOKIE, GUEST_ONLY_PATHS, PROTECTED_PATHS, REFRESH_COOKIE, safeNext, USER_COOKIE } from "@/shared/config/auth";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/shared/i18n/config";

const matches = (pathname: string, paths: string[]) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * 1. Optimistic auth check by the cookie only: guests go to the login page and come back after it.
 *    Whether the token is still valid, the page itself checks on the server.
 * 2. A token that is ending is replaced here, before the page renders, so nobody is sent to the login page for it.
 *    A public page does not wait long for that: if the API sleeps, the next request tries again.
 * 3. Language: addresses have no language prefix (/catalog), the visitor's choice lives in a cookie.
 *    The request is rewritten to the hidden segment (/ru/catalog), so every language is its own
 *    prerendered page and public pages are served from the cache.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // An address with a language prefix (/tg/catalog) — remember the language and drop the prefix.
  const [, first] = pathname.split("/");
  if (isLocale(first)) {
    const url = new URL(`${pathname.slice(first.length + 1) || "/"}${search}`, request.url);
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 31_536_000, sameSite: "lax" });

    return response;
  }

  const isProtected = matches(pathname, PROTECTED_PATHS);
  // A session is whole or it is not there. The header knows the visitor only by the name cookie: without it
  // it shows "Войти", and that person must really be a guest, or the button leads straight into the account.
  const broken = request.cookies.has(USER_COOKIE) !== (request.cookies.has(AUTH_COOKIE) || canRenew(request));
  const renewal: Renewal | null = broken ? { status: "rejected" } : isRenewalDue(request) ? await renewSession(request, isProtected ? 25_000 : 3_000) : null;

  // This request's page must already see what the browser will get.
  if (renewal?.status === "renewed") request.cookies.set(AUTH_COOKIE, renewal.data.token);
  if (renewal?.status === "rejected") [AUTH_COOKIE, REFRESH_COOKIE, USER_COOKIE].forEach((name) => request.cookies.delete(name));

  const signedIn = request.cookies.has(AUTH_COOKIE) || canRenew(request);

  if (!signedIn && isProtected) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);

    return applyRenewal(NextResponse.redirect(login), renewal);
  }

  if (signedIn && matches(pathname, GUEST_ONLY_PATHS)) {
    return applyRenewal(NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next"), "/account"), request.url)), renewal);
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : defaultLocale;

  // Layouts read the path (e.g. the account sends the shop team to the admin panel).
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);

  return applyRenewal(NextResponse.rewrite(new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url), { request: { headers } }), renewal);
}

export const config = {
  // Every page; not the API routes, Next.js assets, the link preview image and files with an extension
  // (icon.png, robots.txt, sitemap.xml).
  matcher: ["/((?!api|_next/static|_next/image|opengraph-image|icon|.*\\..*).*)"],
};
