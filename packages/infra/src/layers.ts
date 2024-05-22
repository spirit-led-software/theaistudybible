import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import type { StackContext } from 'sst/constructs';

export function Layers({ stack, app }: StackContext) {
  // See versions here: https://github.com/axiomhq/axiom-lambda-extension
  const axiomArm64Layer = LayerVersion.fromLayerVersionAttributes(stack, 'AxiomArm64Layer', {
    layerVersionArn: `arn:aws:lambda:${stack.region}:694952825951:layer:axiom-extension-arm64:8`,
    compatibleRuntimes: [Runtime.NODEJS_20_X, Runtime.NODEJS_18_X]
  });

  if (app.stage === 'prod') {
    app.addDefaultFunctionLayers([axiomArm64Layer]);
    app.addDefaultFunctionEnv({
      AXIOM_TOKEN: process.env.AXIOM_TOKEN!,
      AXIOM_DATASET: process.env.AXIOM_DATASET!
    });
  }

  const axiomX86Layer = LayerVersion.fromLayerVersionAttributes(stack, 'AxiomX86Layer', {
    layerVersionArn: `arn:aws:lambda:${stack.region}:694952825951:layer:axiom-extension-x86_64:8`,
    compatibleRuntimes: [Runtime.NODEJS_20_X, Runtime.NODEJS_18_X]
  });

  const chromiumLayer = LayerVersion.fromLayerVersionAttributes(stack, 'ChromiumLayer', {
    layerVersionArn: `arn:aws:lambda:${stack.region}:008193302444:layer:chromium:3`,
    compatibleRuntimes: [Runtime.NODEJS_18_X]
  });

  return {
    axiomArm64Layer,
    axiomX86Layer,
    chromiumLayer
  };
}
