import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/shared/api/requireUser";
import { routes } from "@/shared/config/site";
import { getI18n } from "@/shared/i18n/server";
import { StaffChats } from "@/widgets/chat/ui/StaffChats";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.chat.inbox };
}

/** Inbox with one conversation open — also the link from the manager's Telegram notification. */
export default async function AdminChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversationId = Number(id);

  if (!Number.isInteger(conversationId) || conversationId < 1) notFound();

  const user = await requireUser(routes.adminChat(conversationId));

  return <StaffChats me={{ id: user.id, name: user.name.split(" ")[0], isAdmin: Boolean(user.roles?.includes("admin")) }} conversationId={conversationId} />;
}
