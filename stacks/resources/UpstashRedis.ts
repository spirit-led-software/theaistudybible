import { CustomResource } from 'aws-cdk-lib';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Function } from 'sst/constructs';

export type UpstashRedisProps = {
  email: string;
  apiKey: string;
  name: string;
  tls: boolean;
  eviction?: boolean;
  autoUpgrade?: boolean;
  region?: string;
  retainOnDelete?: boolean;
};

export class UpstashRedis extends Construct {
  public readonly redisUrl: string;
  public readonly restUrl: string;
  public readonly restToken: string;
  public readonly readOnlyRestToken: string;

  constructor(scope: Construct, id: string, props: UpstashRedisProps) {
    super(scope, id);

    const upstashRedisFunction = new Function(this, 'UpstashRedisFunction', {
      handler: 'packages/functions/src/database/upstash-redis.handler',
      enableLiveDev: false // No live dev on custom resources
    });

    const upstashRedisProvider = new Provider(this, 'UpstashRedisProvider', {
      onEventHandler: upstashRedisFunction
    });

    const upstashRedisCustomResource = new CustomResource(this, 'UpstashRedisCustomResource', {
      resourceType: 'Custom::UpstashRedis',
      serviceToken: upstashRedisProvider.serviceToken,
      properties: {
        email: props.email,
        apiKey: props.apiKey,
        name: props.name,
        region: props.region ?? 'us-east-1',
        tls: props.tls,
        eviction: props.eviction ?? true,
        autoUpgrade: props.autoUpgrade ?? true,
        retainOnDelete: props.retainOnDelete ?? true
      }
    });

    this.redisUrl = upstashRedisCustomResource.getAttString('redisUrl');
    this.restUrl = upstashRedisCustomResource.getAttString('restUrl');
    this.restToken = upstashRedisCustomResource.getAttString('restToken');
    this.readOnlyRestToken = upstashRedisCustomResource.getAttString('readOnlyRestToken');
  }
}
