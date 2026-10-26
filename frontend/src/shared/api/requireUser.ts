import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";

/**
 * For protected pages: the user, or a trip to the login page (the expired cookie is cleared on the way).
 */
export async function requireUser(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) redirect(`/api/auth/logout?next=${encodeURIComponent(path)}`);

  return user;
}
