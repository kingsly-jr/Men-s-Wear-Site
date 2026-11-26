import { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.READY_TO_SHIP, OrderStatus.CANCELLED],
  READY_TO_SHIP: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.RETURNED],
  CANCELLED: [],
  RETURNED: [],
};

export const CANCELLABLE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
]);

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  if (from === to) return false;
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function isOrderEligibleForCancellation(status: OrderStatus): boolean {
  return CANCELLABLE_ORDER_STATUSES.has(status);
}

export function isOrderEligibleForReturn(params: {
  status: OrderStatus;
  placedAt: Date;
  returnWindowDays: number;
  now?: Date;
}): boolean {
  if (params.status !== OrderStatus.DELIVERED) {
    return false;
  }
  const now = params.now ?? new Date();
  const windowMs = params.returnWindowDays * 24 * 60 * 60 * 1000;
  return now.getTime() - params.placedAt.getTime() <= windowMs;
}
