import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/guards";
import { GUEST_CART_COOKIE_NAME } from "@/lib/auth/session-constants";
import { listActiveCategories } from "@/services/category.service";
import { listActiveCollections } from "@/services/collection.service";
import { getCartSummary } from "@/services/cart.service";
import { getStoreSettings } from "@/services/settings.service";
import { getUserWishlist } from "@/services/wishlist.service";
import { StoreProvider } from "@/components/layout/store-context";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;

  const [settings, categories, collections, cart, wishlistItems] =
    await Promise.all([
      getStoreSettings(),
      listActiveCategories(),
      listActiveCollections(),
      getCartSummary({
        userId: user?.id ?? null,
        guestToken: user ? null : guestToken,
      }),
      user ? getUserWishlist(user.id) : Promise.resolve([]),
    ]);

  const navCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));
  const navCollections = collections.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <StoreProvider
      initialUser={
        user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          : null
      }
      initialCart={cart}
      initialWishlistIds={wishlistItems.map((item) => item.productId)}
    >
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader
          brandName={settings.brandName}
          categories={navCategories}
          collections={navCollections}
        />
        <SearchOverlay />
        <CartDrawer />
        <main className="flex-1">{children}</main>
        <SiteFooter
          settings={settings}
          categories={navCategories}
          collections={navCollections}
        />
      </div>
    </StoreProvider>
  );
}
