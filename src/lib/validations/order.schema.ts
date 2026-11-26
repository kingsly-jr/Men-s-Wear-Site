import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RequestStatus,
} from "@prisma/client";
import { z } from "zod";
import { addressSchema } from "./auth.schema";

export const checkoutSchema = z
  .object({
    addressId: z.string().uuid().optional(),
    shippingAddress: addressSchema.omit({ label: true, isDefault: true }).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH_ON_DELIVERY),
    couponCode: z.string().trim().toUpperCase().optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.addressId || data.shippingAddress), {
    message: "Select a saved address or enter a shipping address.",
    path: ["shippingAddress"],
  });

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updatePaymentStatusSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateOrderNotesSchema = z.object({
  internalNotes: z.string().trim().max(2000),
});

export const cancellationRequestSchema = z.object({
  reason: z.string().trim().min(10, "Provide a brief reason for cancellation.").max(1000),
});

export const returnRequestSchema = z.object({
  reason: z.string().trim().min(10, "Provide a reason for return.").max(1000),
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().min(1),
        reasonDetail: z.string().trim().max(300).optional().or(z.literal("")),
      })
    )
    .min(1, "Select at least one item to return."),
});

export const reviewRequestSchema = z.object({
  status: z.enum([
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.COMPLETED,
  ]),
  adminNote: z.string().trim().max(1000).optional().or(z.literal("")),
});
