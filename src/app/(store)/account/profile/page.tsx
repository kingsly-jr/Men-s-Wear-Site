import { requireCustomer } from "@/lib/auth/guards";
import { getCustomerProfile } from "@/services/customer.service";
import { AccountProfileClient } from "@/components/storefront/account-profile-client";

export default async function AccountProfilePage() {
  const user = await requireCustomer();
  const profile = await getCustomerProfile(user.id);

  return (
    <AccountProfileClient
      initialName={profile.name}
      initialPhone={profile.phone ?? ""}
      email={profile.email}
    />
  );
}
