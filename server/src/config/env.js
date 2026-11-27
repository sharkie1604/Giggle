import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from process.cwd() as well as server/.env relative to this module
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z
    .string()
    .default('http://localhost:5173')
    .refine(
      (val) => {
        const urls = val.split(',').map((u) => u.trim()).filter(Boolean);
        return (
          urls.length > 0 &&
          urls.every((u) => {
            try {
              new URL(u);
              return true;
            } catch {
              return false;
            }
          })
        );
      },
      { message: 'CLIENT_URL must contain one or more valid comma-separated URLs' }
    ),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.issues
    .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
    .join('\n');
  console.error(`\n❌ CRITICAL: Environment configuration validation failed:\n${formattedErrors}\n`);
  process.exit(1);
}

export const env = parsedEnv.data;
export default env;
