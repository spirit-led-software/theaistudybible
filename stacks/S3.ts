import { Bucket, StackContext } from "sst/constructs";

export function S3({ stack }: StackContext) {
  const bucket = new Bucket(stack, `${stack.stackName}-bucket`);

  stack.addOutputs({
    BucketName: bucket.bucketName,
  });

  return {
    bucket,
  };
}
