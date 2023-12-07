import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { StackContext } from 'sst/constructs';

export function Layers({ stack }: StackContext) {
  const argonLayer = LayerVersion.fromLayerVersionArn(
    stack,
    'Argon2Layer',
    'arn:aws:lambda:us-east-1:008193302444:layer:argon2-layer:1'
  );

  return {
    argonLayer
  };
}
