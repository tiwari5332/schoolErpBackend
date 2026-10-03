import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL postgres connection string'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRATION_MS: z.coerce.number().default(3600000),
  SIGNUP_TOKEN_EXPIRATION_MS: z.coerce.number().default(900000),
  LATE_FEE_SWEEP_CRON: z.string().default('0 2 * * *'),
  DETAILED_LOGGING_URIS: z.string().optional().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed on startup:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  DETAILED_LOGGING_URIS_LIST: parsedEnv.data.DETAILED_LOGGING_URIS.split(',')
    .map((u) => u.trim())
    .filter(Boolean),
};

export const ALLOWED_ORIGINS = ["https://myschoolapp.com", "https://admin.myschoolapp.com", "http://localhost:3000", "http://localhost:5173"]
