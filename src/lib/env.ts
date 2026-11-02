import { z } from "zod";

/**
 * Server environment, validated once at boot (see src/instrumentation.ts).
 * Optional integrations degrade to a clear "not configured" state instead of failing.
 */
const flag = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => v === "true" || v === "1");

const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL: z.string().optional(),
    DATABASE_URL: z.url().optional(),
    PGLITE_DIR: z.string().min(1).default(".data/pglite"),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(3).default("CityRoots <hello@cityroots.ca>"),
    SLACK_WEBHOOK_URL: z.url().optional(),
    NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
    /** Plausible site domain, like cityroots.ca. Unset means no analytics script at all. */
    PLAUSIBLE_DOMAIN: z
      .string()
      .regex(/^[a-z0-9.-]+$/, "Use a bare domain like cityroots.ca")
      .optional(),
    /** Script URL, for a self-hosted Plausible or a proxy. */
    PLAUSIBLE_SCRIPT_SRC: z
      .url()
      .default("https://plausible.io/js/script.outbound-links.tagged-events.js"),
    FEATURE_PARTNERS: flag,
    /** Comma-separated emails that always get the admin role, to bootstrap the first admins. */
    ADMIN_EMAILS: z
      .string()
      .optional()
      .transform((v) =>
        (v ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    FEATURE_BUSINESS: flag,
    /** CI and preview builds only: write magic links to the log instead of emailing them. */
    EMAIL_LOG_ONLY: flag,
    /** Tests only: also append undelivered emails to this file as JSON lines. */
    EMAIL_OUTBOX_FILE: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z
      .string()
      .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_")
      .optional(),
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_")
      .optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  })
  .superRefine((env, ctx) => {
    if (Boolean(env.AUTH_GOOGLE_ID) !== Boolean(env.AUTH_GOOGLE_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_GOOGLE_SECRET"],
        message: "Set both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, or neither",
      });
    }
    if (env.EMAIL_LOG_ONLY && env.VERCEL_ENV === "production") {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_LOG_ONLY"],
        message: "EMAIL_LOG_ONLY must never be set on the production deployment",
      });
    }
    if (env.EMAIL_OUTBOX_FILE && env.VERCEL_ENV === "production") {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_OUTBOX_FILE"],
        message: "EMAIL_OUTBOX_FILE must never be set on the production deployment",
      });
    }
    if (Boolean(env.STRIPE_SECRET_KEY) !== Boolean(env.STRIPE_WEBHOOK_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["STRIPE_WEBHOOK_SECRET"],
        message: "Set both STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, or neither",
      });
    }
    if (env.VERCEL && !env.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required on Vercel (PGlite is for local development only)",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  if (cached) return cached;
  // Treat `KEY=` lines in .env files as unset.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
  const parsed = serverSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  cached = parsed.data;
  return cached;
}

export const features = {
  partners: () => env().FEATURE_PARTNERS,
  business: () => env().FEATURE_BUSINESS,
};
