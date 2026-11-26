"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { CartSummaryView } from "@/services/cart.service";

export interface StoreUserView {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
}

interface StoreContextValue {
  user: StoreUserView | null;
  cart: CartSummaryView;
  wishlistIds: Set<string>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isMutatingCart: boolean;
  addToCart: (variantId: string, quantity?: number, openDrawer?: boolean) => Promise<boolean>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeCartItem: (cartItemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const StoreContext = React.createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = React.useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider.");
  }
  return ctx;
}

export function StoreProvider({
  initialUser,
  initialCart,
  initialWishlistIds,
  children,
}: {
  initialUser: StoreUserView | null;
  initialCart: CartSummaryView;
  initialWishlistIds: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [user] = React.useState<StoreUserView | null>(initialUser);
  const [cart, setCart] = React.useState<CartSummaryView>(initialCart);
  const [wishlistIds, setWishlistIds] = React.useState<Set<string>>(
    () => new Set(initialWishlistIds)
  );
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMutatingCart, setIsMutatingCart] = React.useState(false);

  const refreshCart = React.useCallback(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as CartSummaryView;
      setCart(data);
    }
  }, []);

  const addToCart = React.useCallback(
    async (variantId: string, quantity = 1, openDrawer = true) => {
      setIsMutatingCart(true);
      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({
            title: "Unable to add item",
            description: data?.error?.message ?? "Please try again.",
            variant: "error",
          });
          return false;
        }
        setCart(data as CartSummaryView);
        if (openDrawer) {
          setIsCartOpen(true);
        }
        toast({
          title: "Added to bag",
          description: "Inventory reserved in your shopping bag.",
          variant: "success",
        });
        return true;
      } finally {
        setIsMutatingCart(false);
      }
    },
    [toast]
  );

  const updateCartItem = React.useCallback(
    async (cartItemId: string, quantity: number) => {
      setIsMutatingCart(true);
      try {
        const res = await fetch("/api/cart/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItemId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({
            title: "Quantity error",
            description: data?.error?.message ?? "Unable to update quantity.",
            variant: "error",
          });
          return;
        }
        setCart(data as CartSummaryView);
      } finally {
        setIsMutatingCart(false);
      }
    },
    [toast]
  );

  const removeCartItem = React.useCallback(
    async (cartItemId: string) => {
      setIsMutatingCart(true);
      try {
        const res = await fetch(
          `/api/cart/items?cartItemId=${encodeURIComponent(cartItemId)}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          const data = (await res.json()) as CartSummaryView;
          setCart(data);
          toast({
            title: "Removed from bag",
            variant: "default",
          });
        }
      } finally {
        setIsMutatingCart(false);
      }
    },
    [toast]
  );

  const applyCoupon = React.useCallback(
    async (code: string) => {
      setIsMutatingCart(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({
            title: "Coupon rejected",
            description: data?.error?.message ?? "Invalid coupon code.",
            variant: "error",
          });
          return false;
        }
        setCart(data as CartSummaryView);
        toast({
          title: "Coupon applied",
          description: `Discount code ${code.toUpperCase()} active.`,
          variant: "success",
        });
        return true;
      } finally {
        setIsMutatingCart(false);
      }
    },
    [toast]
  );

  const removeCoupon = React.useCallback(async () => {
    setIsMutatingCart(true);
    try {
      const res = await fetch("/api/cart", { method: "DELETE" });
      if (res.ok) {
        const data = (await res.json()) as CartSummaryView;
        setCart(data);
      }
    } finally {
      setIsMutatingCart(false);
    }
  }, []);

  const toggleWishlist = React.useCallback(
    async (productId: string) => {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save items to your wishlist.",
          variant: "error",
        });
        router.push("/auth/login");
        return;
      }

      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        toast({
          title: "Wishlist error",
          description: "Could not update wishlist.",
          variant: "error",
        });
        return;
      }

      const data = (await res.json()) as { saved: boolean };
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (data.saved) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });

      toast({
        title: data.saved ? "Saved to wishlist" : "Removed from wishlist",
        variant: data.saved ? "success" : "default",
      });
    },
    [router, toast, user]
  );

  return (
    <StoreContext.Provider
      value={{
        user,
        cart,
        wishlistIds,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        isMutatingCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        applyCoupon,
        removeCoupon,
        toggleWishlist,
        refreshCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
