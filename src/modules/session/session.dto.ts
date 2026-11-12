import { z } from 'zod';

export const sessionStatusEnum = z.enum(['upcoming', 'current', 'closed']);
export type SessionStatus = z.infer<typeof sessionStatusEnum>;

export const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name cannot be empty').max(100).optional(),
  startDate: z.string().min(1, 'startDate is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format'),
  endDate: z.string().min(1, 'endDate is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format'),
  copyFromSessionId: z.string().uuid('copyFromSessionId must be a valid UUID').optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'endDate must be after startDate',
  path: ['endDate'],
});

export type CreateSessionDTO = z.infer<typeof createSessionSchema>;

export const updateSessionSchema = z.object({
  name: z.string().min(1, 'Session name cannot be empty').max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format').optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'endDate must be after startDate',
  path: ['endDate'],
});

export type UpdateSessionDTO = z.infer<typeof updateSessionSchema>;

export const querySessionSchema = z.object({
  status: sessionStatusEnum.optional(),
});

export type QuerySessionDTO = z.infer<typeof querySessionSchema>;

export const userPreferenceSchema = z.object({
  selectedSessionId: z.string().uuid('selectedSessionId must be a valid UUID'),
});

export type UserPreferenceDTO = z.infer<typeof userPreferenceSchema>;

export interface AcademicSessionResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  isCurrent: boolean;
}
