import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import type { StackContext } from 'sst/constructs';
import { LANGSMITH_ENV_VARS } from './helpers/langsmith';

export const CLOUDFRONT_HOSTED_ZONE_ID = 'Z2FDTNDATAQYW2';

export const COMMON_ENV_VARS: Record<string, string> = {
  // Environment
  IS_LOCAL: process.env.IS_LOCAL!,
  NODE_ENV: process.env.NODE_ENV!,

  // AI
  UNSTRUCTURED_API_KEY: process.env.UNSTRUCTURED_API_KEY!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,

  // Revenue Cat
  REVENUECAT_PROJECT_ID: process.env.REVENUECAT_PROJECT_ID!,
  REVENUECAT_API_KEY: process.env.REVENUECAT_API_KEY!,
  REVENUECAT_STRIPE_API_KEY: process.env.REVENUECAT_STRIPE_API_KEY!,
  REVENUECAT_WEBHOOK_SECRET: process.env.REVENUECAT_WEBHOOK_SECRET!,

  // Email
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST!,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT!,
  EMAIL_SERVER_USERNAME: process.env.EMAIL_SERVER_USERNAME!,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD!,

  // Admin User
  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,

  // Stripe
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY!,
  STRIPE_API_KEY: process.env.STRIPE_API_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!
};

const invokeBedrockPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: ['*']
});

export function Constants({ stack, app }: StackContext) {
  const hostedZone = HostedZone.fromLookup(stack, 'hostedZone', {
    domainName: 'theaistudybible.com'
  });

  const domainNamePrefix = `${stack.stage !== 'prod' ? `${stack.stage}.test` : ''}`;
  const domainName = `${domainNamePrefix.length > 0 ? `${domainNamePrefix}.` : ''}${
    hostedZone.zoneName
  }`;

  const websiteUrl = app.mode === 'dev' ? 'http://localhost:5173' : `https://${domainName}`;

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  if (app.stage !== 'prod') {
    app.setDefaultRemovalPolicy('destroy');
  }

  app.addDefaultFunctionPermissions([invokeBedrockPolicy]);
  app.addDefaultFunctionEnv({
    ...COMMON_ENV_VARS,
    ...LANGSMITH_ENV_VARS(app, stack),
    PUBLIC_WEBSITE_URL: websiteUrl,
    PUBLIC_API_URL: apiUrl
  });
  app.setDefaultFunctionProps({
    timeout: '60 seconds',
    runtime: 'nodejs20.x',
    nodejs: {
      esbuild: {
        external: ['@sparticuz/chromium'],
        minify: stack.stage === 'prod',
        treeShaking: true,
        target: 'esnext',
        format: 'esm'
      }
    },
    architecture: 'arm_64',
    logRetention: stack.stage === 'prod' ? 'one_week' : 'one_day',
    tracing: app.mode === 'dev' ? 'active' : 'pass_through'
  });

  return {
    hostedZone,
    domainName,
    domainNamePrefix,
    websiteUrl,
    apiDomainName,
    apiUrl
  };
}
