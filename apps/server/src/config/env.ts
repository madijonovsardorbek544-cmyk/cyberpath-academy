import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  APP_BASE_URL: z.string().url().default('http://localhost:4000'),
  JWT_SECRET: z.string().min(16).default('change-me-to-a-long-random-secret'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_PATH: z.string().default('./data/cyberpath.db'),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().min(20).max(5000).default(250),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(3).max(100).default(10),
  MAIL_MODE: z.enum(['console', 'db', 'smtp']).default('console'),
  MAIL_FROM: z.string().email().default('noreply@cyberpath.local'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).optional(),
  ENABLE_DEMO_BILLING: z.enum(['true', 'false']).default('true'),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYME_MERCHANT_ID: z.string().optional(),
  PAYME_MERCHANT_KEY: z.string().optional(),
  PAYME_CHECKOUT_URL: z.string().url().default('https://checkout.paycom.uz/api'),
  SUPPORT_EMAIL: z.string().email().default('madijonovsardorbek544@gmail.com'),
  DEFAULT_LOCALE: z.enum(['en', 'uz', 'ru']).default('en'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid server environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables.');
}


if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET === 'change-me-to-a-long-random-secret') {
  throw new Error('Refusing to start in production with the default JWT secret.');
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.COOKIE_SECURE === 'false') {
  throw new Error('Refusing to start in production with COOKIE_SECURE=false.');
}

if (parsed.data.MAIL_MODE === 'smtp' && (!parsed.data.SMTP_HOST || !parsed.data.SMTP_PORT || !parsed.data.SMTP_USER || !parsed.data.SMTP_PASS)) {
  throw new Error('MAIL_MODE=smtp requires SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
}

const resolvedDatabasePath = path.isAbsolute(parsed.data.DATABASE_PATH)
  ? parsed.data.DATABASE_PATH
  : path.resolve(serverRoot, parsed.data.DATABASE_PATH);

export const env = {
  port: parsed.data.PORT,
  clientUrl: parsed.data.CLIENT_URL,
  appBaseUrl: parsed.data.APP_BASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  databasePath: resolvedDatabasePath,
  cookieSecure: parsed.data.COOKIE_SECURE ? parsed.data.COOKIE_SECURE === 'true' : parsed.data.NODE_ENV === 'production',
  rateLimitMax: parsed.data.RATE_LIMIT_MAX,
  authRateLimitMax: parsed.data.AUTH_RATE_LIMIT_MAX,
  mailMode: parsed.data.MAIL_MODE,
  mailFrom: parsed.data.MAIL_FROM,
  smtpHost: parsed.data.SMTP_HOST,
  smtpPort: parsed.data.SMTP_PORT,
  smtpUser: parsed.data.SMTP_USER,
  smtpPass: parsed.data.SMTP_PASS,
  smtpSecure: parsed.data.SMTP_SECURE === 'true',
  enableDemoBilling: parsed.data.ENABLE_DEMO_BILLING === 'true',
  stripePublishableKey: parsed.data.STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: parsed.data.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET,
  paymeMerchantId: parsed.data.PAYME_MERCHANT_ID,
  paymeMerchantKey: parsed.data.PAYME_MERCHANT_KEY,
  paymeCheckoutUrl: parsed.data.PAYME_CHECKOUT_URL,
  supportEmail: parsed.data.SUPPORT_EMAIL,
  defaultLocale: parsed.data.DEFAULT_LOCALE,
  logLevel: parsed.data.LOG_LEVEL
};
