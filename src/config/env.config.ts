import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_REPLICA_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  CORS_ORIGINS: z.string().default('*'),
  STORAGE_ENDPOINT: z.string().default('localhost'),
  STORAGE_PORT: z.coerce.number().default(9000),
  STORAGE_BUCKET: z.string().default('edutrio-files'),
  STORAGE_ACCESS_KEY: z.string().default('minioadmin'),
  STORAGE_SECRET_KEY: z.string().default('minioadmin'),
  STORAGE_USE_SSL: z.coerce.boolean().default(false),
  STORAGE_REGION: z.string().default('us-east-1'),
  ENFORCE_CONTRACT_COVERAGE: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

let parsedConfig: EnvConfig;
try {
  parsedConfig = EnvSchema.parse(process.env);
} catch (err: any) {
  if (err instanceof z.ZodError) {
    console.error('❌ Environment validation failed on startup:');
    for (const issue of err.issues) {
      console.error(`  - [${issue.path.join('.')}] ${issue.message}`);
    }
  } else {
    console.error('❌ Failed to parse environment:', err);
  }
  // Fallback defaults for testing or bootstrap if critical vars present
  parsedConfig = EnvSchema.parse({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/edutrio',
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_school_erp_production_token_secret_32bytes_min!',
  });
}

export const env = parsedConfig;

