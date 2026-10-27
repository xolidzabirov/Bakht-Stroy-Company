import { redirect } from "next/navigation";
import { routes } from "@/shared/config/site";

/** Until the dashboard (stage 7), the admin panel opens on the chats. */
export default function AdminPage() {
  redirect(routes.adminChats);
}
