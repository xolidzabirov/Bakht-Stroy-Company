import type { NextRequest } from "next/server";
import { callBackend, clearSession, relay, unavailable } from "@/shared/api/bff";
import { AUTH_COOKIE } from "@/shared/config/auth";

type Context = { params: Promise<{ path: string[] }> };

/**
 * /api/proxy/* → Laravel /api/v1/* with the token from the httpOnly cookie.
 * The browser calls only its own origin: no token in JavaScript and no CORS.
 */
async function handle(request: NextRequest, { params }: Context) {
  const { path } = await params;
  const target = `/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  // Raw bytes, so photos and documents reach Laravel intact.
  const body = ["GET", "HEAD"].includes(request.method) ? null : await request.arrayBuffer();

  try {
    const upstream = await callBackend(request, target, { body: body?.byteLength ? body : null, contentType: request.headers.get("content-type") });
    const response = await relay(upstream);

    // The token expired or was revoked (logout on another device) — forget it here too.
    return upstream.status === 401 && request.cookies.has(AUTH_COOKIE) ? clearSession(response) : response;
  } catch {
    return unavailable();
  }
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST, handle as PUT };
