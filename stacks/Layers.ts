import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import type { StackContext } from 'sst/constructs';

export function Layers({ stack, app }: StackContext) {
  const argonLayer = LayerVersion.fromLayerVersionArn(
    stack,
    'Argon2Layer',
    `arn:aws:lambda:${stack.region}:008193302444:layer:argon2-arm64:3`
  );

  // See versions here: https://github.com/axiomhq/axiom-lambda-extension
  const axiomArm64Layer = LayerVersion.fromLayerVersionArn(
    stack,
    'AxiomLayer',
    `arn:aws:lambda:${stack.region}:694952825951:layer:axiom-extension-arm64:8`
  );
  app.addDefaultFunctionLayers([axiomArm64Layer]);
  app.addDefaultFunctionEnv({
    AXIOM_TOKEN: process.env.AXIOM_TOKEN!,
    AXIOM_DATASET: process.env.AXIOM_DATASET!
  });

  const axiomX86Layer = LayerVersion.fromLayerVersionArn(
    stack,
    'AxiomLayer',
    `arn:aws:lambda:${stack.region}:694952825951:layer:axiom-extension-x86_64:8`
  );

  const chromiumLayer = LayerVersion.fromLayerVersionArn(
    stack,
    'ChromiumLayer',
    `arn:aws:lambda:${stack.region}:008193302444:layer:chromium:2`
  );

  return {
    argonLayer,
    axiomArm64Layer,
    axiomX86Layer,
    chromiumLayer
  };
}
