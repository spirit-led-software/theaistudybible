import { Bucket, StackContext } from "sst/constructs";

export function S3({ stack }: StackContext) {
  const bucket = new Bucket(stack, `${stack.stackName}-bucket`);

  stack.addOutputs({
    "S3 Bucket Name": bucket.bucketName,
  });

  return {
    bucket,
  };
}
