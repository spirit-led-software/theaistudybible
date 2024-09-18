export const OPENAI_API_KEY = new sst.Secret('OpenAiApiKey');
export const ANTHROPIC_API_KEY = new sst.Secret('AnthropicApiKey');

export const ADMIN_EMAIL = new sst.Secret('AdminEmail');
export const ADMIN_PASSWORD = new sst.Secret('AdminPassword');

export const STRIPE_SECRET_KEY = new sst.Secret('StripeSecretKey');
export const STRIPE_WEBHOOK_SECRET = new sst.Secret('StripeWebhookSecret');

export const SENTRY_AUTH_TOKEN = new sst.Secret('SentryAuthToken');

export default [
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  SENTRY_AUTH_TOKEN,
];
