import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { FloatingChat } from "@/widgets/chat/ui/FloatingChat";

/**
 * Public shop pages: site header and footer.
 * Signed-in customers also get the floating chat button.
 * The account (/account) and the admin panel (/admin) have their own layouts without them.
 */
export default function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingChat />
    </div>
  );
}
