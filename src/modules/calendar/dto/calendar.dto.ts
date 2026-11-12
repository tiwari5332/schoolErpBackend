import { z } from 'zod';

export const CalendarEventsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM').optional(),
});

export type CalendarEventsQueryDto = z.infer<typeof CalendarEventsQuerySchema>;

export const CalendarUpcomingQuerySchema = z.object({
  days: z.coerce.number().int().positive().optional().default(30),
});

export type CalendarUpcomingQueryDto = z.infer<typeof CalendarUpcomingQuerySchema>;

export const CalendarEventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['EVENT', 'HOLIDAY', 'EXAM', 'MEETING', 'OTHER']).optional().default('EVENT'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  allDay: z.boolean().optional().default(true),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  description: z.string().optional().default(''),
  audience: z.enum(['ALL', 'STAFF', 'PARENTS', 'STUDENTS', 'CLASS', 'SECTION']).optional().default('ALL'),
  isHoliday: z.boolean().optional().default(false),
  color: z.string().optional().default('#6366F1'),
  notify: z.boolean().optional(),
});

export type CalendarEventCreateDto = z.infer<typeof CalendarEventCreateSchema>;

export const CalendarEventUpdateSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['EVENT', 'HOLIDAY', 'EXAM', 'MEETING', 'OTHER']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  allDay: z.boolean().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  description: z.string().optional(),
  audience: z.enum(['ALL', 'STAFF', 'PARENTS', 'STUDENTS', 'CLASS', 'SECTION']).optional(),
  isHoliday: z.boolean().optional(),
  color: z.string().optional(),
});

export type CalendarEventUpdateDto = z.infer<typeof CalendarEventUpdateSchema>;

