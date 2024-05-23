import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import type { StackContext } from 'sst/constructs';

export function Layers({ stack }: StackContext) {
  const chromiumLayer = LayerVersion.fromLayerVersionAttributes(stack, 'ChromiumLayer', {
    layerVersionArn: `arn:aws:lambda:${stack.region}:008193302444:layer:chromium:3`,
    compatibleRuntimes: [Runtime.NODEJS_18_X]
  });

  return {
    chromiumLayer
  };
}
