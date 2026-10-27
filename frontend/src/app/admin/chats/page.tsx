import type { Metadata } from "next";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { StaffChats } from "@/widgets/chat/ui/StaffChats";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.chat.inbox };
}

/** Inbox without an open conversation (on phones — just the list). */
export default async function AdminChatsPage() {
  const user = await requireUser(routes.adminChats);

  return <StaffChats me={{ id: user.id, name: user.name.split(" ")[0], isAdmin: Boolean(user.roles?.includes("admin")) }} conversationId={null} />;
}
