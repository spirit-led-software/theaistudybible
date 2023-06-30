import { Bucket, StackContext } from "sst/constructs";

export default function S3Stack({ stack }: StackContext) {
  const bucket = new Bucket(stack, `${stack.stackName}-bucket`, {
    name:
      stack.stage === "prod"
        ? "chatesv-index-files"
        : `${stack.stackName}-index-files`,
  });

  return {
    bucket,
  };
}
