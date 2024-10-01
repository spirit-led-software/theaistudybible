export const OPENAI_API_KEY = new sst.Secret('OpenAiApiKey');
export const ANTHROPIC_API_KEY = new sst.Secret('AnthropicApiKey');

export const ADMIN_EMAIL = new sst.Secret('AdminEmail');
export const ADMIN_PASSWORD = new sst.Secret('AdminPassword');

export const STRIPE_SECRET_KEY = new sst.Secret('StripeSecretKey', process.env.STRIPE_API_KEY);

export const SENTRY_AUTH_TOKEN = new sst.Secret('SentryAuthToken', process.env.SENTRY_TOKEN);
