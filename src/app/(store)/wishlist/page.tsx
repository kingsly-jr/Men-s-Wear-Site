import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { getUserWishlist } from "@/services/wishlist.service";
import { Button } from "@/components/ui/button";
import { WishlistClient } from "@/components/storefront/wishlist-client";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved Crimson Terminal garments.",
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <Heart
          className="mx-auto mb-4 h-10 w-10 text-primary"
          strokeWidth={1.5}
        />
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Sign In to Access Your Wishlist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Wishlists are persisted directly to your account across devices.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/auth/login?next=/wishlist">
            <Button variant="primary">Sign In</Button>
          </Link>
          <Link href="/auth/register?next=/wishlist">
            <Button variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = await getUserWishlist(user.id);
  return <WishlistClient initialItems={items} />;
}
