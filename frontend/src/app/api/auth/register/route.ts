import type { NextRequest } from "next/server";
import { callBackend, deviceName, relay, unavailable, withSession } from "@/shared/api/bff";

/**
 * POST /api/auth/register — last step of the wizard:
 * { registration_token, first_name, last_name, customer_type, email, password, password_confirmation }
 * → account created and signed in right away (token in the httpOnly cookie).
 */
export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({}));

  try {
    const upstream = await callBackend(request, "/auth/register", {
      method: "POST",
      body: JSON.stringify({
        registration_token: input.registration_token,
        first_name: input.first_name,
        last_name: input.last_name,
        customer_type: input.customer_type,
        email: input.email,
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
