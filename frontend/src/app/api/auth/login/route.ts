import type { NextRequest } from "next/server";
import { callBackend, deviceName, relay, unavailable, withSession } from "@/shared/api/bff";

/**
 * POST /api/auth/login { email, password, remember } → token in the httpOnly cookie, user in the body.
 */
export async function POST(request: NextRequest) {
  const { email, password, remember = true } = await request.json().catch(() => ({}));

  try {
    const upstream = await callBackend(request, "/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, device_name: deviceName(request) }),
    });

    return upstream.ok ? withSession(await upstream.json(), Boolean(remember)) : relay(upstream);
  } catch {
    return unavailable();
  }
}
