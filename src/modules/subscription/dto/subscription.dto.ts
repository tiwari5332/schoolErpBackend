import { z } from 'zod';

export const SubscriptionCheckoutSchema = z.object({
  planCode: z.string().min(1, 'planCode is required'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  couponCode: z.string().optional(),
});

export type SubscriptionCheckoutDto = z.infer<typeof SubscriptionCheckoutSchema>;

export const SubscriptionConfirmSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  paymentId: z.string().min(1, 'paymentId is required'),
  signature: z.string().min(1, 'signature is required'),
});

export type SubscriptionConfirmDto = z.infer<typeof SubscriptionConfirmSchema>;

export const SubscriptionChangePlanSchema = z.object({
  planCode: z.string().min(1, 'planCode is required'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
});

export type SubscriptionChangePlanDto = z.infer<typeof SubscriptionChangePlanSchema>;

export const SubscriptionCancelSchema = z.object({
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

export type SubscriptionCancelDto = z.infer<typeof SubscriptionCancelSchema>;

export const SubscriptionInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

export type SubscriptionInvoicesQueryDto = z.infer<typeof SubscriptionInvoicesQuerySchema>;

