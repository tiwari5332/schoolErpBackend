import { z } from 'zod';

export const SchoolProfileUpdateSchema = z.object({
  name: z.string().optional(),
  board: z.string().optional(),
  udiseCode: z.string().optional(),
  logoFileId: z.string().optional(),
  brandColor: z.string().optional(),
  address: z.any().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
});

export type SchoolProfileUpdateDto = z.infer<typeof SchoolProfileUpdateSchema>;

export const PreferencesUpdateSchema = z.object({
  admissionNoFormat: z.string().optional(),
  receiptNoFormat: z.string().optional(),
  attendanceCutoffTime: z.string().optional(),
  lateFeeEnabled: z.boolean().optional(),
  blockAdmitCardOnDues: z.boolean().optional(),
  concessionApprovalThresholdPercent: z.number().optional(),
  notifyParentOnAbsent: z.boolean().optional(),
  defaultChannels: z.array(z.string()).optional(),
  workingDays: z.array(z.number()).optional(),
});

export type PreferencesUpdateDto = z.infer<typeof PreferencesUpdateSchema>;

export const FileUploadSchema = z.object({
  purpose: z.string().optional().default('GENERAL'),
  file: z.any().optional(),
  name: z.string().optional(),
});

export type FileUploadDto = z.infer<typeof FileUploadSchema>;

export const AuditLogsQuerySchema = z.object({
  actorId: z.string().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

export type AuditLogsQueryDto = z.infer<typeof AuditLogsQuerySchema>;

