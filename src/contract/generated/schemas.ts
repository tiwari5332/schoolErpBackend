// AUTO-GENERATED FROM api-contract.json - DO NOT EDIT MANUALLY
import { z } from 'zod';
import { ContractEnums, ErrorCodes } from './enums';

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum(ErrorCodes as unknown as [string, ...string[]]),
    message: z.string(),
    details: z.array(z.object({
      field: z.string().optional(),
      message: z.string(),
    })).optional(),
  }),
  requestId: z.string(),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export function createSuccessEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: PaginationMetaSchema.optional(),
    requestId: z.string(),
  });
}
