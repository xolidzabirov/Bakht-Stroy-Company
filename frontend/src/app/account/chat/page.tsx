import type { Metadata } from "next";
import { getI18n } from "@/shared/i18n/server";
import { ClientChat } from "@/widgets/chat/ui/ClientChat";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.chat.title, robots: { index: false } };
}

/** The chat with the manager on the whole account area (the window between the header and the bottom tabs). */
export default function AccountChatPage() {
  return (
    <div className="-mx-4 -mt-6 h-[calc(100dvh-4rem-4.5rem)] overflow-hidden border-border bg-surface sm:mx-0 sm:mt-0 sm:h-[calc(100dvh-10rem)] sm:rounded-2xl sm:border lg:h-[calc(100dvh-8.5rem)]">
      <ClientChat variant="page" active />
    </div>
  );
}
