import {
  Architecture,
  Code,
  LayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { StackContext } from "sst/constructs";

export function Layers({ stack }: StackContext) {
  const chromiumLayer = new LayerVersion(stack, "chromiumLayer", {
    code: Code.fromAsset("layers/chromium/chromium-v114.0.0-layer.zip"),
    compatibleRuntimes: [Runtime.NODEJS_18_X],
    compatibleArchitectures: [Architecture.X86_64],
    removalPolicy:
      stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
  });

  return {
    chromiumLayer,
  };
}
