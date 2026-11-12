import { z } from 'zod';

export const StudentAttendanceGetQuerySchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export type StudentAttendanceGetQueryDto = z.infer<typeof StudentAttendanceGetQuerySchema>;

export const StudentAttendanceRecordInputSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
  remark: z.string().nullable().optional(),
});

export const StudentAttendanceMarkSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  records: z.array(StudentAttendanceRecordInputSchema),
  notifyParentsOfAbsent: z.boolean().optional().default(false),
});

export type StudentAttendanceMarkDto = z.infer<typeof StudentAttendanceMarkSchema>;

export const StudentAttendanceSummaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
});

export type StudentAttendanceSummaryQueryDto = z.infer<typeof StudentAttendanceSummaryQuerySchema>;

export const StudentAttendanceMonthlyQuerySchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM'),
});

export type StudentAttendanceMonthlyQueryDto = z.infer<typeof StudentAttendanceMonthlyQuerySchema>;

export const StaffAttendanceGetQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
});

export type StaffAttendanceGetQueryDto = z.infer<typeof StaffAttendanceGetQuerySchema>;

export const StaffAttendanceRecordInputSchema = z.object({
  staffId: z.string().min(1, 'staffId is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE']),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  remark: z.string().nullable().optional(),
});

export const StaffAttendanceMarkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  records: z.array(StaffAttendanceRecordInputSchema),
});

export type StaffAttendanceMarkDto = z.infer<typeof StaffAttendanceMarkSchema>;

export const StaffAttendanceCheckInSchema = z.object({
  action: z.enum(['CHECK_IN', 'CHECK_OUT']),
});

export type StaffAttendanceCheckInDto = z.infer<typeof StaffAttendanceCheckInSchema>;

export const StaffAttendanceMonthlyQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM'),
});

export type StaffAttendanceMonthlyQueryDto = z.infer<typeof StaffAttendanceMonthlyQuerySchema>;

