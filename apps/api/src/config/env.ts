import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  GCP_PROJECT_ID: z.string().min(1),
  GCP_LOCATION: z.string().default('us-central1'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  CORS_ORIGIN: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated by ConfigModule at startup. Throws on missing/invalid values so the
 * app fails fast rather than misbehaving later.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }
  return parsed.data;
}
