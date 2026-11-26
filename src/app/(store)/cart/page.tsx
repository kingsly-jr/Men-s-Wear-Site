import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: "Review your selected menswear garments, apply coupons, and proceed to checkout.",
};

export default function CartPage() {
  return <CartPageClient />;
}
