import { requireCustomer } from "@/lib/auth/guards";
import { getCustomerOrderDetail } from "@/services/order.service";
import { getStoreSettings } from "@/services/settings.service";
import { OrderDetailClient } from "@/components/storefront/order-detail-client";

export default async function AccountOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCustomer();
  const { id } = await params;
  const sp = await searchParams;

  const [order, settings] = await Promise.all([
    getCustomerOrderDetail(user.id, id),
    getStoreSettings(),
  ]);

  return (
    <OrderDetailClient
      justPlaced={sp.placed === "true"}
      returnWindowDays={settings.returnWindowDays}
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
        couponCode: order.couponUsage?.coupon.code ?? null,
        shippingAddress: order.shippingAddress,
        paymentRecord: order.paymentRecord
          ? {
              method: order.paymentRecord.method,
              status: order.paymentRecord.status,
              reference: order.paymentRecord.reference,
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
        })),
        cancellationRequests: order.cancellationRequests.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          adminNote: r.adminNote,
        })),
        returnRequests: order.returnRequests.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          adminNote: r.adminNote,
        })),
      }}
    />
  );
}
