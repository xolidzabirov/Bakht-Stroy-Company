import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

/**
 * Public shop pages: site header and footer.
 * The account (/account) and the admin panel (/admin) have their own layouts without them.
 */
export default function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
