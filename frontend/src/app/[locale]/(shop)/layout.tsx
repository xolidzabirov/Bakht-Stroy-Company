import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { FloatingChat } from "@/widgets/chat/ui/FloatingChat";
import { setLocaleFrom } from "@/shared/i18n/server";

/**
 * Public shop pages: site header and footer.
 * Signed-in customers also get the floating chat button.
 * The account (/account) and the admin panel (/admin) have their own layouts without them.
 */
export default async function ShopLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  await setLocaleFrom(params);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingChat />
    </div>
  );
}
