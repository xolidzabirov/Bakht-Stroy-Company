import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_MAX_AGE, USER_COOKIE } from "@/shared/config/auth";
import { env } from "@/shared/config/env";

/**
 * Server side of the BFF: Route Handlers call Laravel on behalf of the browser.
 * Adds the token from the httpOnly cookie, the client IP (rate limits) and the device name (sessions list).
 */
export async function callBackend(request: NextRequest, path: string, init: { method?: string; body?: string | null } = {}): Promise<Response> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const forwardedFor = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");

  return fetch(`${env.apiUrl}${path}`, {
    method: init.method ?? request.method,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      "Accept-Language": request.headers.get("accept-language") ?? "ru",
      "User-Agent": request.headers.get("user-agent") ?? "Bakht Stroy web",
    },
    body: init.body ?? undefined,
    cache: "no-store",
  });
}

/** "Chrome Windows", "Safari iPhone" — shown in the account's sessions list. */
export function deviceName(request: NextRequest): string {
  const ua = request.headers.get("user-agent") ?? "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /YaBrowser/.test(ua) ? "Яндекс Браузер" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Браузер";
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";

  return `${browser} ${os}`.trim();
}

type AuthPayload = { data: { user: { name: string }; token: string } };

/**
 * Turns the API answer with a token into a browser response: the token goes to the httpOnly cookie,
 * the body keeps only the user. "remember = false" makes a session cookie (gone when the browser closes).
 */
export function withSession(payload: AuthPayload, remember = true, status = 200): NextResponse {
  const response = NextResponse.json({ data: { user: payload.data.user } }, { status });
  const maxAge = remember ? SESSION_MAX_AGE : undefined;
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(AUTH_COOKIE, payload.data.token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
  response.cookies.set(USER_COOKIE, payload.data.user.name.split(" ")[0], { secure, sameSite: "lax", path: "/", maxAge });

  return response;
}

export function clearSession(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIE);
  response.cookies.delete(USER_COOKIE);

  return response;
}

/** Passes the Laravel answer to the browser as is (status, JSON error format). */
export async function relay(upstream: Response): Promise<NextResponse> {
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

/** When the API is down — the same error format as Laravel. */
export function unavailable(): NextResponse {
  return NextResponse.json({ message: "Сервер временно недоступен. Попробуйте через минуту.", code: "SERVICE_UNAVAILABLE" }, { status: 503 });
}
