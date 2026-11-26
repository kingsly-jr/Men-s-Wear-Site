import { getAdminOrderDetail } from "@/services/order.service";
import { OrderInspector } from "@/components/admin/order-inspector";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  return (
    <OrderInspector
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        placedAt: order.placedAt.toISOString(),
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        totalAmount: Number(order.totalAmount),
        internalNotes: order.internalNotes,
        couponCode: order.couponUsage?.coupon.code ?? null,
        customer: order.user,
        shippingAddress: order.shippingAddress,
        paymentRecord: order.paymentRecord
          ? {
              method: order.paymentRecord.method,
              status: order.paymentRecord.status,
              reference: order.paymentRecord.reference,
              notes: order.paymentRecord.notes,
            }
          : null,
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantSku: item.variantSku,
          sizeName: item.sizeName,
          colorName: item.colorName,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
        })),
        statusHistory: order.statusHistory.map((h) => ({
          id: h.id,
          toStatus: h.toStatus,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
          changedByName: h.changedBy?.name ?? null,
        })),
        cancellationRequests: order.cancellationRequests.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          adminNote: r.adminNote,
          createdAt: r.createdAt.toISOString(),
        })),
        returnRequests: order.returnRequests.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          adminNote: r.adminNote,
          createdAt: r.createdAt.toISOString(),
          items: r.items.map((ri) => ({
            id: ri.id,
            quantity: ri.quantity,
            productName: ri.orderItem.productName,
            variantSku: ri.orderItem.variantSku,
          })),
        })),
      }}
    />
  );
}
