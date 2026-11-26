import { listAdminCustomers } from "@/services/customer.service";
import { CustomersTable } from "@/components/admin/customers-table";

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();

  return (
    <CustomersTable
      initialCustomers={customers.map((c) => ({
        ...c,
        emailVerifiedAt: c.emailVerifiedAt
          ? c.emailVerifiedAt.toISOString()
          : null,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
