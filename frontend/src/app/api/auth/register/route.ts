import type { NextRequest } from "next/server";
import { callBackend, deviceName, relay, unavailable, withSession } from "@/shared/api/bff";

/**
 * POST /api/auth/register { name, email, code, phone?, password, password_confirmation }
 * → account created and signed in right away (token in the httpOnly cookie).
 */
export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({}));

  try {
    const upstream = await callBackend(request, "/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        code: input.code,
        phone: input.phone || null,
        password: input.password,
        password_confirmation: input.password_confirmation,
        device_name: deviceName(request),
      }),
    });

    return upstream.ok ? withSession(await upstream.json(), true, 201) : relay(upstream);
  } catch {
    return unavailable();
  }
}
