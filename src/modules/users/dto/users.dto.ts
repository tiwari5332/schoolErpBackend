import { z } from 'zod';

export const UsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  search: z.string().optional(),
  roleId: z.string().optional(),
  status: z.string().optional(),
});

export type UsersQueryDto = z.infer<typeof UsersQuerySchema>;

export const UserInviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  roleId: z.string().min(1, 'roleId is required'),
});

export type UserInviteDto = z.infer<typeof UserInviteSchema>;

export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export type UserUpdateDto = z.infer<typeof UserUpdateSchema>;

export const UserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type UserStatusDto = z.infer<typeof UserStatusSchema>;

