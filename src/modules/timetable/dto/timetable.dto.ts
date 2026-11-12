import { z } from 'zod';

export const PeriodInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Period name is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be HH:mm'),
  isBreak: z.boolean().optional().default(false),
  order: z.number().int().positive().optional().default(1),
});

export const PeriodsPutSchema = z.object({
  workingDays: z.array(z.number().int().min(1).max(7)).optional().default([1, 2, 3, 4, 5, 6]),
  periods: z.array(PeriodInputSchema).min(1, 'At least one period is required'),
});

export type PeriodsPutDto = z.infer<typeof PeriodsPutSchema>;

export const TimetableByClassQuerySchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
});

export type TimetableByClassQueryDto = z.infer<typeof TimetableByClassQuerySchema>;

export const TimetableByTeacherQuerySchema = z.object({
  staffId: z.string().optional(),
});

export type TimetableByTeacherQueryDto = z.infer<typeof TimetableByTeacherQuerySchema>;

export const TimetableEntryUpsertSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  periodId: z.string().min(1, 'periodId is required'),
  subjectId: z.string().min(1, 'subjectId is required'),
  teacherId: z.string().min(1, 'teacherId is required'),
  room: z.string().nullable().optional(),
});

export type TimetableEntryUpsertDto = z.infer<typeof TimetableEntryUpsertSchema>;

export const TimetableSubstituteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  entryId: z.string().min(1, 'entryId is required'),
  substituteTeacherId: z.string().min(1, 'substituteTeacherId is required'),
  reason: z.string().optional(),
});

export type TimetableSubstituteDto = z.infer<typeof TimetableSubstituteSchema>;

export const TimetableFreeTeachersQuerySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  periodId: z.string().min(1, 'periodId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
});

export type TimetableFreeTeachersQueryDto = z.infer<typeof TimetableFreeTeachersQuerySchema>;

