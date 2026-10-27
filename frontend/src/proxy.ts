import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, GUEST_ONLY_PATHS, PROTECTED_PATHS, safeNext } from "@/shared/config/auth";

const matches = (pathname: string, paths: string[]) => paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Optimistic check by the cookie only (no API call): guests go to the login page and come back after it.
 * Whether the token is still valid, the page itself checks on the server.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.has(AUTH_COOKIE);

  if (!signedIn && matches(pathname, PROTECTED_PATHS)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(login);
  }

  if (signedIn && matches(pathname, GUEST_ONLY_PATHS)) {
    return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next"), "/account"), request.url));
  }

  // Layouts read the path (e.g. the account sends the shop team to the admin panel).
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/cart/:path*", "/favorites/:path*", "/checkout/:path*", "/login", "/register", "/forgot-password"],
};
