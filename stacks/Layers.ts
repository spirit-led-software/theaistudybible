import { Code, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { StackContext } from "sst/constructs";

export function Layers({ stack }: StackContext) {
  const chromiumLayer = new LayerVersion(stack, "chromiumLayer", {
    code: Code.fromAsset("layers/chromium"),
  });

  return {
    chromiumLayer,
  };
}
