import { z } from 'zod';

export const FeeCategoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
});

export type FeeCategoryCreateDto = z.infer<typeof FeeCategoryCreateSchema>;

export const FeeHeadInputSchema = z.object({
  categoryId: z.string().min(1, 'categoryId is required'),
  amount: z.coerce.number().min(0, 'amount must be non-negative'),
});

export const FeeStructureCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  classId: z.string().min(1, 'classId is required'),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).optional().default('MONTHLY'),
  heads: z.array(FeeHeadInputSchema).min(1, 'At least one fee head is required'),
  dueDate: z.string().optional(),
});

export type FeeStructureCreateDto = z.infer<typeof FeeStructureCreateSchema>;

export const FeeStructureUpdateSchema = z.object({
  name: z.string().optional(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).optional(),
  heads: z.array(FeeHeadInputSchema).optional(),
  dueDate: z.string().optional(),
});

export type FeeStructureUpdateDto = z.infer<typeof FeeStructureUpdateSchema>;

export const FeeAssignStudentSchema = z.object({
  categoryId: z.string().min(1, 'categoryId is required'),
  amount: z.coerce.number().positive('amount must be positive'),
  period: z.string().min(1, 'period is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD'),
});

export type FeeAssignStudentDto = z.infer<typeof FeeAssignStudentSchema>;

export const FeeLineAllocationInputSchema = z.object({
  lineId: z.string().min(1, 'lineId is required'),
  amount: z.coerce.number().positive('amount must be positive'),
});

export const FeeCollectSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  amount: z.coerce.number().positive('amount must be positive'),
  mode: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CHEQUE']).optional().default('CASH'),
  reference: z.string().optional(),
  lineAllocations: z.array(FeeLineAllocationInputSchema).optional(),
});

export type FeeCollectDto = z.infer<typeof FeeCollectSchema>;

export const FeePaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  mode: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  studentId: z.string().optional(),
});

export type FeePaymentsQueryDto = z.infer<typeof FeePaymentsQuerySchema>;

export const FeePaymentRefundSchema = z.object({
  reason: z.string().min(1, 'reason is required'),
  amount: z.coerce.number().positive().optional(),
});

export type FeePaymentRefundDto = z.infer<typeof FeePaymentRefundSchema>;

export const FeeConcessionSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  lineId: z.string().optional(),
  amount: z.coerce.number().positive('amount must be positive'),
  reason: z.string().min(1, 'reason is required'),
});

export type FeeConcessionDto = z.infer<typeof FeeConcessionSchema>;

export const FeeDuesQuerySchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

export type FeeDuesQueryDto = z.infer<typeof FeeDuesQuerySchema>;

export const FeeRemindersSendSchema = z.object({
  studentIds: z.array(z.string()).optional(),
  classId: z.string().optional(),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']).optional().default('SMS'),
});

export type FeeRemindersSendDto = z.infer<typeof FeeRemindersSendSchema>;

export const FeeOnlineInitiateSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  lineIds: z.array(z.string()).min(1, 'At least one line is required'),
  amount: z.coerce.number().positive('amount must be positive'),
});

export type FeeOnlineInitiateDto = z.infer<typeof FeeOnlineInitiateSchema>;

export const FeeOnlineConfirmSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  paymentId: z.string().min(1, 'paymentId is required'),
  signature: z.string().optional(),
  studentId: z.string().min(1, 'studentId is required'),
  amount: z.coerce.number().positive('amount must be positive'),
  lineIds: z.array(z.string()).optional(),
});

export type FeeOnlineConfirmDto = z.infer<typeof FeeOnlineConfirmSchema>;

