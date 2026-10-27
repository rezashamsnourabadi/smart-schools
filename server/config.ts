import 'dotenv/config';
import { z } from 'zod';

const env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('postgres://school_app:local-app-password@127.0.0.1:55432/schools'),
  MIGRATION_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://127.0.0.1:56379'),
  APP_ORIGIN: z.string().url().default('http://localhost:3000'),
  API_PORT: z.coerce.number().default(3001),
  SESSION_SECRET: z.string().min(32).default('development-only-change-this-secret-before-production'),
  S3_ENDPOINT: z.string().default('http://127.0.0.1:59000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('school-private'),
  S3_ACCESS_KEY: z.string().default('local-storage'),
  S3_SECRET_KEY: z.string().default('local-storage-password'),
  SMS_WEBHOOK_URL: z.preprocess(value=>value===''?undefined:value,z.string().url().optional()),
  SMS_WEBHOOK_TOKEN: z.string().optional(),
  BALE_BOT_TOKEN: z.string().optional(),
  METRICS_TOKEN: z.preprocess(value=>value===''?undefined:value,z.string().min(32).optional()),
  TRUSTED_PROXY_CIDRS: z.string().default('127.0.0.1/32,::1/128'),
});
export const config = env.parse(process.env);
if (config.NODE_ENV === 'production' && (config.SESSION_SECRET.startsWith('development-') || !config.APP_ORIGIN.startsWith('https://') || config.DATABASE_URL.includes('local-app-password') || config.S3_SECRET_KEY === 'local-storage-password')) {
  throw new Error('Production requires HTTPS and private database, session and storage credentials.');
}
