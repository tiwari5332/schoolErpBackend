import { z } from 'zod';

export const PortalLeaveApplySchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  reason: z.string().min(1, 'Reason is required'),
});

export type PortalLeaveApplyDto = z.infer<typeof PortalLeaveApplySchema>;

export const PortalAttendanceQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM').optional(),
});

export type PortalAttendanceQueryDto = z.infer<typeof PortalAttendanceQuerySchema>;

