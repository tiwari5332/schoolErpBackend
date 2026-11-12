import { z } from 'zod';

export const SessionCreateSchema = z.object({
  name: z.string().min(2, 'Session name is required (e.g. 2026-27)'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
});

export type SessionCreateDto = z.infer<typeof SessionCreateSchema>;

export const SessionRolloverSchema = z.object({
  targetSessionId: z.string().min(1, 'targetSessionId is required'),
  copy: z.array(z.string()).optional().default(['CLASSES', 'SUBJECTS']),
});

export type SessionRolloverDto = z.infer<typeof SessionRolloverSchema>;

export const SectionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Section name is required'),
  capacity: z.number().int().positive().optional().default(40),
  classTeacherId: z.string().nullable().optional(),
});

export const ClassCreateSchema = z.object({
  name: z.string().min(1, 'Class name is required (e.g. Class 6)'),
  displayOrder: z.number().int().optional().default(0),
  sections: z.array(SectionInputSchema).min(1, 'At least one section is required'),
});

export type ClassCreateDto = z.infer<typeof ClassCreateSchema>;

export const ClassUpdateSchema = z.object({
  name: z.string().optional(),
  displayOrder: z.number().int().optional(),
  sections: z.array(SectionInputSchema).optional(),
});

export type ClassUpdateDto = z.infer<typeof ClassUpdateSchema>;

export const SubjectCreateSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  type: z.enum(['THEORY', 'PRACTICAL', 'BOTH']).optional().default('THEORY'),
  isElective: z.boolean().optional().default(false),
});

export type SubjectCreateDto = z.infer<typeof SubjectCreateSchema>;

export const SubjectUpdateSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(['THEORY', 'PRACTICAL', 'BOTH']).optional(),
  isElective: z.boolean().optional(),
});

export type SubjectUpdateDto = z.infer<typeof SubjectUpdateSchema>;

export const ClassSubjectsAssignSchema = z.object({
  subjectIds: z.array(z.string()),
});

export type ClassSubjectsAssignDto = z.infer<typeof ClassSubjectsAssignSchema>;

export const GradeBandSchema = z.object({
  grade: z.string().min(1),
  minPercent: z.number(),
  maxPercent: z.number(),
  gradePoint: z.number(),
});

export const GradeScaleUpsertSchema = z.object({
  name: z.string().min(1, 'Grade scale name is required'),
  bands: z.array(GradeBandSchema).min(1, 'At least one grade band is required'),
});

export type GradeScaleUpsertDto = z.infer<typeof GradeScaleUpsertSchema>;

