import { getAdminCustomerDetail } from "@/services/customer.service";
import { CustomerDetailClient } from "@/components/admin/customer-detail-client";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getAdminCustomerDetail(id);

  return (
    <CustomerDetailClient
      customer={{
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isActive: customer.isActive,
        emailVerifiedAt: customer.emailVerifiedAt
          ? customer.emailVerifiedAt.toISOString()
          : null,
        createdAt: customer.createdAt.toISOString(),
        addresses: customer.addresses,
        orders: customer.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentRecord?.status ?? "PENDING",
          totalAmount: Number(o.totalAmount),
          placedAt: o.placedAt.toISOString(),
        })),
      }}
    />
  );
}
