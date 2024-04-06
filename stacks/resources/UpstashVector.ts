import { CustomResource } from 'aws-cdk-lib';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Function } from 'sst/constructs';

export type UpstashVectorProps = {
  email: string;
  apiKey: string;
  name: string;
  region?: 'eu-west-1' | 'us-east-1';
  similarityFunction: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  dimensionCount: number;
  type?: 'payg' | 'fixed';
  retainOnDelete?: boolean;
};

export class UpstashVector extends Construct {
  public readonly endpoint: string;
  public readonly token: string;
  public readonly readOnlyToken: string;

  constructor(scope: Construct, id: string, props: UpstashVectorProps) {
    super(scope, id);

    const upstashVectorFunction = new Function(this, 'UpstashVectorFunction', {
      handler: 'packages/functions/src/database/upstash-vector.handler',
      enableLiveDev: false // No live dev on custom resources
    });

    const upstashVectorProvider = new Provider(this, 'UpstashVectorProvider', {
      onEventHandler: upstashVectorFunction
    });

    const upstashVectorCustomResource = new CustomResource(this, 'UpstashVectorCustomResource', {
      resourceType: 'Custom::UpstashVector',
      serviceToken: upstashVectorProvider.serviceToken,
      properties: {
        email: props.email,
        apiKey: props.apiKey,
        name: props.name,
        region: props.region ?? 'us-east-1',
        similarityFunction: props.similarityFunction,
        dimensionCount: props.dimensionCount,
        type: props.type ?? 'payg',
        retainOnDelete: props.retainOnDelete ?? true
      }
    });

    this.endpoint = upstashVectorCustomResource.getAttString('endpoint');
    this.token = upstashVectorCustomResource.getAttString('token');
    this.readOnlyToken = upstashVectorCustomResource.getAttString('readOnlyToken');
  }
}
