import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, GUEST_ONLY_PATHS, PROTECTED_PATHS, safeNext } from "@/shared/config/auth";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/shared/i18n/config";

const matches = (pathname: string, paths: string[]) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * 1. Optimistic auth check by the cookie only (no API call): guests go to the login page and come back after it.
 *    Whether the token is still valid, the page itself checks on the server.
 * 2. Language: addresses have no language prefix (/catalog), the visitor's choice lives in a cookie.
 *    The request is rewritten to the hidden segment (/ru/catalog), so every language is its own
 *    prerendered page and public pages are served from the cache.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // An address with a language prefix (/tg/catalog) — remember the language and drop the prefix.
  const [, first] = pathname.split("/");
  if (isLocale(first)) {
    const url = new URL(`${pathname.slice(first.length + 1) || "/"}${search}`, request.url);
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, first, { path: "/", maxAge: 31_536_000, sameSite: "lax" });

    return response;
  }

  const signedIn = request.cookies.has(AUTH_COOKIE);

  if (!signedIn && matches(pathname, PROTECTED_PATHS)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(login);
  }

  if (signedIn && matches(pathname, GUEST_ONLY_PATHS)) {
    return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next"), "/account"), request.url));
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : defaultLocale;

  // Layouts read the path (e.g. the account sends the shop team to the admin panel).
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);

  return NextResponse.rewrite(new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url), { request: { headers } });
}

export const config = {
  // Every page; not the API routes, Next.js assets, the link preview image and files with an extension
  // (icon.png, robots.txt, sitemap.xml).
  matcher: ["/((?!api|_next/static|_next/image|opengraph-image|.*\\..*).*)"],
};
