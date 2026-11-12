import { z } from 'zod';

export const ExamsListQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

export type ExamsListQueryDto = z.infer<typeof ExamsListQuerySchema>;

export const ExamPaperInputSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  subjectId: z.string().min(1, 'subjectId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be HH:mm'),
  maxMarks: z.coerce.number().positive('maxMarks must be positive'),
  passMarks: z.coerce.number().positive('passMarks must be positive'),
  room: z.string().nullable().optional(),
});

export const ExamCreateSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  type: z.enum(['TERM', 'UNIT', 'FINAL', 'MID_TERM', 'CLASS_TEST']).optional().default('TERM'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  classIds: z.array(z.string()).min(1, 'At least one class is required'),
  gradeScaleId: z.string().nullable().optional(),
  weightage: z.coerce.number().optional().default(100),
  papers: z.array(ExamPaperInputSchema).optional().default([]),
});

export type ExamCreateDto = z.infer<typeof ExamCreateSchema>;

export const ExamUpdateSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['TERM', 'UNIT', 'FINAL', 'MID_TERM', 'CLASS_TEST']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classIds: z.array(z.string()).optional(),
  gradeScaleId: z.string().nullable().optional(),
  weightage: z.coerce.number().optional(),
  papers: z.array(ExamPaperInputSchema).optional(),
});

export type ExamUpdateDto = z.infer<typeof ExamUpdateSchema>;

export const ExamMarksGetQuerySchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  subjectId: z.string().min(1, 'subjectId is required'),
});

export type ExamMarksGetQueryDto = z.infer<typeof ExamMarksGetQuerySchema>;

export const ExamMarksRowInputSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  marks: z.coerce.number().nullable().optional(),
  isAbsent: z.boolean().optional().default(false),
  remark: z.string().nullable().optional(),
});

export const ExamMarksSaveSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  subjectId: z.string().min(1, 'subjectId is required'),
  rows: z.array(ExamMarksRowInputSchema),
});

export type ExamMarksSaveDto = z.infer<typeof ExamMarksSaveSchema>;

export const ExamMarksLockSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  subjectId: z.string().min(1, 'subjectId is required'),
});

export type ExamMarksLockDto = z.infer<typeof ExamMarksLockSchema>;

export const ExamResultsQuerySchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
});

export type ExamResultsQueryDto = z.infer<typeof ExamResultsQuerySchema>;

export const ReportCardGetQuerySchema = z.object({
  examId: z.string().min(1, 'examId is required'),
});

export type ReportCardGetQueryDto = z.infer<typeof ReportCardGetQuerySchema>;

export const ReportCardPdfBulkSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  studentIds: z.array(z.string()).optional().default([]),
});

export type ReportCardPdfBulkDto = z.infer<typeof ReportCardPdfBulkSchema>;

export const AdmitCardsPdfSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().optional(),
  studentIds: z.array(z.string()).optional().default([]),
});

export type AdmitCardsPdfDto = z.infer<typeof AdmitCardsPdfSchema>;

