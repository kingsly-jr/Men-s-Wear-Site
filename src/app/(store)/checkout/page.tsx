import type { Metadata } from "next";
import { requireCustomer } from "@/lib/auth/guards";
import { getCustomerProfile } from "@/services/customer.service";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm shipping details, payment method, and place your order.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireCustomer("/auth/login?next=/checkout");
  const profile = await getCustomerProfile(user.id);

  return <CheckoutClient savedAddresses={profile.addresses} />;
}
