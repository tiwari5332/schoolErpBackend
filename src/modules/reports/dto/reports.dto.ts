import { z } from 'zod';

export const ReportDataRunSchema = z.object({
  filters: z.record(z.any()).optional().default({}),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ReportDataRunDto = z.infer<typeof ReportDataRunSchema>;

export const ReportExportJobSchema = z.object({
  format: z.enum(['xlsx', 'csv', 'pdf']).optional().default('xlsx'),
  filters: z.record(z.any()).optional().default({}),
});

export type ReportExportJobDto = z.infer<typeof ReportExportJobSchema>;

