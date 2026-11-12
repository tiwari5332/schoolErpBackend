import { z } from 'zod';

export const StudentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  q: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.string().optional(),
  gender: z.string().optional(),
  feeDue: z.coerce.boolean().optional(),
  sortBy: z.string().optional().default('fullName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type StudentsQueryDto = z.infer<typeof StudentsQuerySchema>;

export const GuardianInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Guardian name is required'),
  relation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER']).optional().default('FATHER'),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  isPrimary: z.boolean().optional().default(true),
  createLogin: z.boolean().optional(),
});

export const StudentCreateSchema = z.object({
  admissionNo: z.string().min(1, 'Admission number is required'),
  rollNo: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be YYYY-MM-DD'),
  bloodGroup: z.string().optional(),
  classId: z.string().min(1, 'classId is required'),
  sectionId: z.string().min(1, 'sectionId is required'),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'admissionDate must be YYYY-MM-DD'),
  category: z.string().optional().default('GENERAL'),
  photoFileId: z.string().nullable().optional(),
  address: z.object({
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  guardians: z.array(GuardianInputSchema).optional().default([]),
  autoAssignFees: z.boolean().optional(),
});

export type StudentCreateDto = z.infer<typeof StudentCreateSchema>;

export const StudentUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bloodGroup: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  rollNo: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  guardians: z.array(GuardianInputSchema).optional(),
});

export type StudentUpdateDto = z.infer<typeof StudentUpdateSchema>;

export const StudentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'ALUMNI', 'SUSPENDED']),
  reason: z.string().optional(),
  effectiveDate: z.string().optional(),
});

export type StudentStatusDto = z.infer<typeof StudentStatusSchema>;

export const StudentDocumentUploadSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.string().min(1, 'Document type is required'),
  file: z.any().optional(),
});

export type StudentDocumentUploadDto = z.infer<typeof StudentDocumentUploadSchema>;

export const StudentPromoteSchema = z.object({
  fromSessionId: z.string().min(1),
  toSessionId: z.string().min(1),
  fromClassId: z.string().min(1),
  fromSectionId: z.string().min(1),
  toClassId: z.string().min(1),
  toSectionId: z.string().min(1),
  studentIds: z.array(z.string()).min(1),
  action: z.enum(['PROMOTE', 'RETAIN']).optional().default('PROMOTE'),
  carryForwardDues: z.boolean().optional(),
});

export type StudentPromoteDto = z.infer<typeof StudentPromoteSchema>;

export const StudentTcGenerateSchema = z.object({
  leavingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1, 'Reason is required'),
  conduct: z.string().optional().default('GOOD'),
  overrideDues: z.boolean().optional().default(false),
});

export type StudentTcGenerateDto = z.infer<typeof StudentTcGenerateSchema>;

export const StudentIdCardsSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  template: z.string().optional().default('DEFAULT'),
});

export type StudentIdCardsDto = z.infer<typeof StudentIdCardsSchema>;

