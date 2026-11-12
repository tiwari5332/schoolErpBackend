import { z } from 'zod';

export const RoleCreateSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export type RoleCreateDto = z.infer<typeof RoleCreateSchema>;

export const RoleUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export type RoleUpdateDto = z.infer<typeof RoleUpdateSchema>;

