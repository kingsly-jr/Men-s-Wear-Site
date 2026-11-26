import { listAdminOrders } from "@/services/order.service";
import { OrdersTable } from "@/components/admin/orders-table";

export default async function AdminOrdersPage() {
  const orders = await listAdminOrders();

  return (
    <OrdersTable
      initialOrders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user.name,
        customerEmail: o.user.email,
        status: o.status,
        paymentStatus: o.paymentRecord?.status ?? "PENDING",
        paymentMethod: o.paymentRecord?.method ?? "CASH_ON_DELIVERY",
        itemCount: o._count.items,
        totalAmount: Number(o.totalAmount),
        placedAt: o.placedAt.toISOString(),
      }))}
    />
  );
}
