export const OPENAI_API_KEY = new sst.Secret('OpenAiApiKey');
export const ANTHROPIC_API_KEY = new sst.Secret('AnthropicApiKey');
export const GROQ_API_KEY = new sst.Secret('GroqApiKey');
export const DEEP_SEEK_API_KEY = new sst.Secret('DeepSeekApiKey');
export const GOOGLE_AI_API_KEY = new sst.Secret('GoogleAiApiKey');
export const VOYAGE_AI_API_KEY = new sst.Secret('VoyageAiApiKey');

export const BRAIN_TRUST_API_KEY = new sst.Secret('BrainTrustApiKey');

export const ADMIN_EMAIL = new sst.Secret('AdminEmail');
export const ADMIN_PASSWORD = new sst.Secret('AdminPassword');

export const TEST_USER_EMAIL = new sst.Secret('TestUserEmail');
export const TEST_USER_PASSWORD = new sst.Secret('TestUserPassword');

export const STRIPE_SECRET_KEY = new sst.Secret('StripeSecretKey', process.env.STRIPE_API_KEY);

export const SENTRY_AUTH_TOKEN = new sst.Secret('SentryAuthToken', process.env.SENTRY_TOKEN);

export const VAPID_PRIVATE_KEY = new sst.Secret('VapidPrivateKey');

export const GOOGLE_CLIENT_ID = new sst.Secret('GoogleClientId');
export const GOOGLE_CLIENT_SECRET = new sst.Secret('GoogleClientSecret');

export const APPLE_CLIENT_ID = new sst.Secret('AppleClientId');
export const APPLE_TEAM_ID = new sst.Secret('AppleTeamId');
export const APPLE_KEY_ID = new sst.Secret('AppleKeyId');
export const APPLE_AUTH_KEY = new sst.Secret('AppleAuthKey');
