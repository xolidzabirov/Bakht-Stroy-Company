import type { NextRequest } from "next/server";
import { applyRenewal, callBackend, canRenew, clearSession, isRenewalDue, relay, renewSession, type Renewal, unavailable } from "@/shared/api/bff";
import { AUTH_COOKIE } from "@/shared/config/auth";

type Context = { params: Promise<{ path: string[] }> };

/**
 * /api/proxy/* → Laravel /api/v1/* with the token from the httpOnly cookie.
 * The browser calls only its own origin: no token in JavaScript and no CORS.
 * A token that has ended is replaced on the way, the request goes through and the visitor notices nothing.
 */
async function handle(request: NextRequest, { params }: Context) {
  const { path } = await params;
  const target = `/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  // Raw bytes, so photos and documents reach Laravel intact.
  const body = ["GET", "HEAD"].includes(request.method) ? null : await request.arrayBuffer();

  try {
    const send = (token?: string) => callBackend(request, target, { body: body?.byteLength ? body : null, contentType: request.headers.get("content-type"), token });
    const newToken = (result: Renewal | null) => (result?.status === "renewed" ? result.data.token : undefined);

    let renewal = isRenewalDue(request) ? await renewSession(request) : null;
    let upstream = await send(newToken(renewal));

    // The API says the token is no good although the cookie looked fine: one more try with a new one.
    if (upstream.status === 401 && !renewal && canRenew(request)) {
      renewal = await renewSession(request);
      if (renewal.status === "renewed") upstream = await send(renewal.data.token);
    }

    // Nobody knows yet whether the session is alive: "server is busy" is true, "you are signed out" may not be.
    if (upstream.status === 401 && renewal?.status === "unavailable") return unavailable();

    const response = applyRenewal(await relay(upstream), renewal);

    // Revoked (logout on another device) and nothing to renew it with — forget it here too.
    return upstream.status === 401 && !renewal && request.cookies.has(AUTH_COOKIE) ? clearSession(response) : response;
  } catch {
    return unavailable();
  }
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST, handle as PUT };
