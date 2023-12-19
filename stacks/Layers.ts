import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import type { StackContext } from 'sst/constructs';

export function Layers({ stack, app }: StackContext) {
  const argonLayer = LayerVersion.fromLayerVersionArn(
    stack,
    'Argon2Layer',
    `arn:aws:lambda:${stack.region}:008193302444:layer:argon2-layer:1`
  );

  const axiomLayer = LayerVersion.fromLayerVersionArn(
    stack,
    'AxiomLayer',
    `arn:aws:lambda:${stack.region}:694952825951:layer:axiom-extension-x86_64:8`
  );
  app.addDefaultFunctionLayers([axiomLayer]);
  app.addDefaultFunctionEnv({
    AXIOM_TOKEN: process.env.AXIOM_TOKEN!,
    AXIOM_DATASET: process.env.AXIOM_DATASET!
  });

  return {
    argonLayer,
    axiomLayer
  };
}
