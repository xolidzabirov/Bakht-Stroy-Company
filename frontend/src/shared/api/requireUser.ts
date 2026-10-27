import { redirect } from "next/navigation";
import { routes } from "@/shared/config/site";
import { getCurrentUser, type CurrentUser } from "./session";

/**
 * For protected pages: the user, or a trip to the login page (the expired cookie is cleared on the way).
 */
export async function requireUser(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) redirect(`/api/auth/logout?next=${encodeURIComponent(path)}`);

  return user;
}

/** Admin panel pages: managers and administrators; customers go to their account. */
export async function requireStaff(path: string): Promise<CurrentUser> {
  const user = await requireUser(path);

  if (!user.is_staff) redirect(routes.account);

  return user;
}

/** Administrator-only pages (users, roles, store settings); managers go back to the dashboard. */
export async function requireAdmin(path: string): Promise<CurrentUser> {
  const user = await requireStaff(path);

  if (!isAdmin(user)) redirect(routes.admin);

  return user;
}

export const isAdmin = (user: CurrentUser) => Boolean(user.roles?.includes("admin"));
