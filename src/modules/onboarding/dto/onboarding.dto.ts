import { z } from 'zod';

export const RegisterTenantSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  board: z.string().optional().default('CBSE'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  adminName: z.string().min(2, 'Admin name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  planCode: z.string().optional().default('GROWTH'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional().default('YEARLY'),
  acceptTerms: z.boolean().optional(),
});

export type RegisterTenantDto = z.infer<typeof RegisterTenantSchema>;

