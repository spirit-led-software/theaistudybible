import { STATIC_ENV_VARS } from '@stacks';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import type { StackContext } from 'sst/constructs';

export function Constants({ stack, app }: StackContext) {
  const hostedZone = HostedZone.fromLookup(stack, 'hostedZone', {
    domainName: 'revelationsai.com'
  });

  const domainNamePrefix = `${stack.stage !== 'prod' ? `${stack.stage}.test` : ''}`;
  const domainName = `${domainNamePrefix.length > 0 ? `${domainNamePrefix}.` : ''}${
    hostedZone.zoneName
  }`;

  const websiteUrl = app.mode === 'dev' ? 'http://localhost:3000' : `https://${domainName}`;

  const authUiDomainName = `auth.${domainName}`;
  const authUiUrl = app.mode === 'dev' ? `http://localhost:8910` : `https://${authUiDomainName}`;

  if (app.stage !== 'prod') {
    app.setDefaultRemovalPolicy('destroy');
  }

  app.addDefaultFunctionEnv({
    ...STATIC_ENV_VARS,
    WEBSITE_URL: websiteUrl,
    AUTH_URL: authUiUrl
  });

  app.setDefaultFunctionProps({
    timeout: '60 seconds',
    runtime: 'nodejs18.x',
    nodejs: {
      esbuild: {
        external: ['argon2', '@sparticuz/chromium', 'web-streams-polyfill'],
        minify: stack.stage === 'prod',
        treeShaking: stack.stage === 'prod',
        format: 'esm'
      }
    },
    architecture: 'arm_64',
    logRetention: stack.stage === 'prod' ? 'one_week' : 'one_day',
    tracing: app.mode === 'dev' ? 'active' : 'pass_through'
  });

  const invokeBedrockPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
    resources: ['*']
  });

  return {
    hostedZone,
    domainName,
    domainNamePrefix,
    websiteUrl,
    authUiDomainName,
    authUiUrl,
    invokeBedrockPolicy
  };
}
