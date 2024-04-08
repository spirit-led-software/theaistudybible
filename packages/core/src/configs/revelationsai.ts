import type { RAIConfig } from '../types/config';

export default {
  llm: {
    chat: {
      defaultModel: 'claude-3-haiku-20240307'
    },
    embeddings: {
      model: 'cohere.embed-multilingual-v3',
      dimensions: 1024,
      chunkSize: 1024,
      chunkOverlap: 256
    }
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY!
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!
  },
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!
    },
    apple: {
      teamId: process.env.APPLE_TEAM_ID!,
      keyId: process.env.APPLE_KEY_ID!,
      clientId: process.env.APPLE_CLIENT_ID!
    },
    admin: {
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!
    }
  },
  email: {
    from: process.env.EMAIL_FROM!,
    replyTo: process.env.EMAIL_REPLY_TO!,
    host: process.env.EMAIL_SERVER_HOST!,
    port: parseInt(process.env.EMAIL_SERVER_PORT!),
    credentials: {
      username: process.env.EMAIL_SERVER_USERNAME!,
      password: process.env.EMAIL_SERVER_PASSWORD!
    }
  },
  revenueCat: {
    projectId: process.env.REVENUECAT_PROJECT_ID!,
    apiKey: process.env.REVENUECAT_API_KEY!
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY!
  },
  unstructured: {
    apiKey: process.env.UNSTRUCTURED_API_KEY!
  },
  website: {
    url: process.env.PUBLIC_WEBSITE_URL!,
    authUrl: process.env.PUBLIC_AUTH_URL!
  }
} satisfies RAIConfig;
