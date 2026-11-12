import { z } from 'zod';

export const updateStudentSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(255).optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional().nullable(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be in YYYY-MM-DD format').optional().nullable(),
  address: z.string().optional().nullable(),
  aadharNo: z.string().optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  dateOfAdmission: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfAdmission must be in YYYY-MM-DD format').optional().nullable(),
  previousSchool: z.string().max(255).optional().nullable(),

  // Academic Placement / Enrollment
  sectionId: z.string().uuid('sectionId must be a valid UUID').optional(),
  rollNo: z.coerce.number().int().min(1).optional().nullable(),

  // Parent / Primary Guardian details
  parentName: z.string().max(255).optional(),
  parentMsisdn: z.string().min(8).max(20).optional(),
  parentEmail: z.string().email('Invalid parent email').optional().nullable(),
  relation: z.string().max(50).optional(),
  guardianOccupation: z.string().max(100).optional().nullable(),
  guardianAddress: z.string().optional().nullable(),
});

export type UpdateStudentDTO = z.infer<typeof updateStudentSchema>;

export const queryStudentsSchema = z.object({
  sectionId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type QueryStudentsDTO = z.infer<typeof queryStudentsSchema>;

