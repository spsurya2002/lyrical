import { z } from 'zod';

/**
 * The single place environment is read.
 *
 * Nothing else in the codebase may read `process.env`, and no limit, price, or
 * threshold may appear as a literal elsewhere — see docs/subscription_plans.md
 * and constitution Principle VI. A hardcoded `4` or `199` is a defect.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  /** The four-source bar (D-003). Tunable without a migration or a code change. */
  GROUNDING_MIN_SOURCES: z.coerce.number().int().positive().default(4),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  LLM_PROVIDER: z.enum(['gemini', 'ollama']).default('ollama'),
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  LLM_MODEL_RENDERING: z.string().default('gemini-2.5-flash'),

  /**
   * Reads are cheap and cached, and cost no model money — the constitution's
   * cost concern lives on the model path, not here. This is generous on purpose:
   * one reader clicking through a 26-line song makes 50+ requests, and real
   * users share IPs behind office NAT and mobile carriers.
   */
  RATE_LIMIT_READ_PER_MINUTE: z.coerce.number().int().positive().default(600),
  RATE_LIMIT_MODEL_PER_MINUTE: z.coerce.number().int().positive().default(10),
});

export type Config = z.infer<typeof schema>;

function load(): Config {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Fail loudly at boot rather than at the first request that needed the value.
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const config: Config = load();
