import { z } from 'zod';

export const StaffQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  q: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  roleId: z.string().optional(),
});

export type StaffQueryDto = z.infer<typeof StaffQuerySchema>;

export const StaffAssignmentSchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  isClassTeacher: z.boolean().optional().default(false),
});

export const StaffCreateSchema = z.object({
  employeeCode: z.string().min(1, 'employeeCode is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be YYYY-MM-DD'),
  email: z.string().email().optional(),
  phone: z.string().min(5, 'phone is required'),
  designation: z.string().min(1, 'designation is required'),
  department: z.string().min(1, 'department is required'),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'joiningDate must be YYYY-MM-DD'),
  qualification: z.string().optional(),
  salaryGrade: z.string().nullable().optional(),
  roleId: z.string().min(1, 'roleId is required'),
  createLogin: z.boolean().optional(),
  assignments: z.array(StaffAssignmentSchema).optional().default([]),
});

export type StaffCreateDto = z.infer<typeof StaffCreateSchema>;

export const StaffUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  assignments: z.array(StaffAssignmentSchema).optional(),
});

export type StaffUpdateDto = z.infer<typeof StaffUpdateSchema>;

export const StaffStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']),
  reason: z.string().optional(),
  effectiveDate: z.string().optional(),
});

export type StaffStatusDto = z.infer<typeof StaffStatusSchema>;

export const LeaveApplySchema = z.object({
  type: z.enum(['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'MATERNITY', 'OTHER']),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be YYYY-MM-DD'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be YYYY-MM-DD'),
  reason: z.string().min(1, 'reason is required'),
  halfDay: z.boolean().optional().default(false),
});

export type LeaveApplyDto = z.infer<typeof LeaveApplySchema>;

export const LeavesListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  status: z.string().optional(),
  staffId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type LeavesListQueryDto = z.infer<typeof LeavesListQuerySchema>;

export const LeaveDecideSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().optional(),
});

export type LeaveDecideDto = z.infer<typeof LeaveDecideSchema>;

