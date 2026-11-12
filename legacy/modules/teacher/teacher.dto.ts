import { z } from 'zod';

export const updateTeacherSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(255).optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  loginMsisdn: z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional(),
  msisdns: z.string().optional().nullable(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be in YYYY-MM-DD format').optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other']).optional().nullable(),
  address: z.string().optional().nullable(),
  aadharNo: z.string().optional().nullable(),
  panNo: z.string().optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfJoining must be in YYYY-MM-DD format').optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  employeeType: z.string().max(50).optional().nullable(),
  departmentId: z.string().uuid('departmentId must be a valid UUID').optional().nullable(),
});

export type UpdateTeacherDTO = z.infer<typeof updateTeacherSchema>;

