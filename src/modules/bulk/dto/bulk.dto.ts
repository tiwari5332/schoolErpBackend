import { z } from 'zod';

export const BulkUploadSchema = z.object({
  entity: z.enum(['STUDENTS', 'STAFF', 'FEE_ASSIGNMENTS', 'MARKS', 'GUARDIANS']),
  fileName: z.string().optional().default('import.csv'),
  rows: z.array(z.record(z.any())).optional(),
});

export type BulkUploadDto = z.infer<typeof BulkUploadSchema>;

export const BulkHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

export type BulkHistoryQueryDto = z.infer<typeof BulkHistoryQuerySchema>;

