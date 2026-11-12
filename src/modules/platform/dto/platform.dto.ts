import { z } from 'zod';

export const PlatformTenantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  plan: z.string().optional(),
});

export type PlatformTenantsQueryDto = z.infer<typeof PlatformTenantsQuerySchema>;

export const PlatformTenantStatusSchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']),
  reason: z.string().optional(),
});

export type PlatformTenantStatusDto = z.infer<typeof PlatformTenantStatusSchema>;

export const PlatformPlanCreateSchema = z.object({
  code: z.string().min(2, 'Plan code is required'),
  name: z.string().min(2, 'Plan name is required'),
  description: z.string().optional(),
  priceMonthly: z.number().nonnegative('Monthly price must be non-negative'),
  priceYearly: z.number().nonnegative('Yearly price must be non-negative'),
  currency: z.string().optional().default('INR'),
  trialDays: z.number().int().nonnegative().optional().default(14),
  limits: z.object({
    students: z.number().int().positive(),
    staff: z.number().int().positive(),
    storageGb: z.number().positive(),
    smsCredits: z.number().int().nonnegative(),
  }),
  features: z.array(z.string()),
  isActive: z.boolean().optional().default(true),
});

export type PlatformPlanCreateDto = z.infer<typeof PlatformPlanCreateSchema>;

export const PlatformPlanUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  priceMonthly: z.number().nonnegative().optional(),
  priceYearly: z.number().nonnegative().optional(),
  limits: z.object({
    students: z.number().int().positive(),
    staff: z.number().int().positive(),
    storageGb: z.number().positive(),
    smsCredits: z.number().int().nonnegative(),
  }).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type PlatformPlanUpdateDto = z.infer<typeof PlatformPlanUpdateSchema>;

