import { requireCustomer } from "@/lib/auth/guards";
import { getCustomerProfile } from "@/services/customer.service";
import { AccountAddressesClient } from "@/components/storefront/account-addresses-client";

export default async function AccountAddressesPage() {
  const user = await requireCustomer();
  const profile = await getCustomerProfile(user.id);

  return <AccountAddressesClient initialAddresses={profile.addresses} />;
}
