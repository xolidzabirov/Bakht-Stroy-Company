import { redirect } from "next/navigation";
import { routes } from "@/shared/config/site";
import { getCurrentUser, type CurrentUser } from "./session";

/**
 * For protected pages: the user. Without one — a trip through /api/auth/refresh: back to this page with a new token,
 * or to the login page when the session has really ended.
 */
export async function requireUser(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`);

  return user;
}

/** Admin panel pages: managers and administrators; customers go to their account. */
export async function requireStaff(path: string): Promise<CurrentUser> {
  const user = await requireUser(path);

  if (!user.is_staff) redirect(routes.account);

  return user;
}

/** Cart, checkout and favorites: customers only; the shop team goes to the admin panel. */
export async function requireCustomer(path: string): Promise<CurrentUser> {
  const user = await requireUser(path);

  if (user.is_staff) redirect(routes.admin);

  return user;
}

/** Administrator-only pages (users, roles, store settings); managers go back to the dashboard. */
export async function requireAdmin(path: string): Promise<CurrentUser> {
  const user = await requireStaff(path);

  if (!isAdmin(user)) redirect(routes.admin);

  return user;
}

export const isAdmin = (user: CurrentUser) => Boolean(user.roles?.includes("admin"));
