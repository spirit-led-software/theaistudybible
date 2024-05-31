export const CLOUDFRONT_HOSTED_ZONE_ID = "Z2FDTNDATAQYW2";

export const COMMON_ENV_VARS: Record<string, string> = {
  // Environment
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

  // Clerk
  PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY!,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET!,

  // Stripe
  PUBLIC_STRIPE_PUBLIC_KEY: process.env.PUBLIC_STRIPE_PUBLIC_KEY!,
  STRIPE_API_KEY: process.env.STRIPE_API_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
};

export const LANGSMITH_ENV_VARS: Record<string, string> = {
  LANGCHAIN_TRACING_V2: "true",
  LANGCHAIN_ENDPOINT: "https://api.smith.langchain.com",
  LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY!,
  LANGCHAIN_PROJECT: `${$app.name}-${$app.stage}`,
  LANGCHAIN_CALLBACKS_BACKGROUND: "true",
};

export const hostedZone = await aws.route53.getZone({
  name: "theaistudybible.com",
});

export const domainNamePrefix = `${$app.stage !== "prod" ? `${$app.stage}.test` : ""}`;
export const domainName = `${domainNamePrefix.length > 0 ? `${domainNamePrefix}.` : ""}${
  hostedZone.name
}`;

$transform(sst.aws.Function, (args) => {
  args.permissions = $resolve([args.permissions]).apply(([permissions]) => [
    ...(permissions ?? []),
    {
      actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
      resources: ["*"],
    },
  ]);
  args.environment = $resolve([args.environment]).apply(([environment]) => ({
    ...environment,
    ...COMMON_ENV_VARS,
    ...LANGSMITH_ENV_VARS,
  }));
  args.timeout = "60 seconds";
  args.runtime = "nodejs20.x";
  args.nodejs = $resolve([args.nodejs]).apply(([nodejs]) => ({
    ...nodejs,
    esbuild: {
      ...nodejs?.esbuild,
      external: ["@sparticuz/chromium"],
      minify: $app.stage === "prod",
      treeShaking: true,
    },
  }));
  args.logging = {
    retention: $app.stage === "prod" ? "1 week" : "1 day",
  };
});
