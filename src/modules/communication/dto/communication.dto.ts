import { z } from 'zod';

export const NoticesQuerySchema = z.object({
  targetAudience: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

export type NoticesQueryDto = z.infer<typeof NoticesQuerySchema>;

export const NoticeCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'STAFF', 'PARENTS', 'CLASS']).optional().default('ALL'),
  targetClassIds: z.array(z.string()).optional().default([]),
  channels: z.array(z.enum(['IN_APP', 'SMS', 'WHATSAPP', 'EMAIL'])).optional().default(['IN_APP']),
  attachments: z.array(z.any()).optional().default([]),
});

export type NoticeCreateDto = z.infer<typeof NoticeCreateSchema>;

export const NoticeRecipientCountSchema = z.object({
  targetAudience: z.enum(['ALL', 'STUDENTS', 'STAFF', 'PARENTS', 'CLASS']).optional().default('ALL'),
  targetClassIds: z.array(z.string()).optional().default([]),
});

export type NoticeRecipientCountDto = z.infer<typeof NoticeRecipientCountSchema>;

export const TemplateUpsertSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']),
  content: z.string().min(1, 'Content is required'),
  variables: z.array(z.string()).optional().default([]),
});

export type TemplateUpsertDto = z.infer<typeof TemplateUpsertSchema>;

export const ThreadCreateSchema = z.object({
  subject: z.string().optional(),
  studentId: z.string().optional(),
  participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
  initialMessage: z.string().min(1, 'Initial message is required'),
});

export type ThreadCreateDto = z.infer<typeof ThreadCreateSchema>;

export const MessageSendSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  attachments: z.array(z.any()).optional().default([]),
});

export type MessageSendDto = z.infer<typeof MessageSendSchema>;

