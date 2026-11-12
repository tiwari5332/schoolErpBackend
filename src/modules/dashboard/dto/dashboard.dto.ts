import { z } from 'zod';

export const TrendQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional().default('7d'),
});

export type TrendQueryDto = z.infer<typeof TrendQuerySchema>;

export const ApprovalDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().optional(),
});

export type ApprovalDecisionDto = z.infer<typeof ApprovalDecisionSchema>;

export const ApprovalsListQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional().default('PENDING'),
  type: z.string().optional(),
});

export type ApprovalsListQueryDto = z.infer<typeof ApprovalsListQuerySchema>;

export const GlobalSearchQuerySchema = z.object({
  q: z.string().default(''),
  limit: z.coerce.number().optional().default(8),
});

export type GlobalSearchQueryDto = z.infer<typeof GlobalSearchQuerySchema>;

export const NotificationsQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(20),
});

export type NotificationsQueryDto = z.infer<typeof NotificationsQuerySchema>;


