import { StoreProvider } from "@/components/providers/store-provider";
import { CatalogProvider } from "@/components/providers/catalog-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Toaster } from "@/components/layout/toaster";
import { listCategories, listProducts } from "@/server/repo";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // Active products go to the client for the cart, wishlist and checkout.
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  return (
    <CatalogProvider products={products} categories={categories}>
      <StoreProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:p-3">
          Skip to content
        </a>
        <AnnouncementBar />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CartDrawer />
        <Toaster />
      </StoreProvider>
    </CatalogProvider>
  );
}
