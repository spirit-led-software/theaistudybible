import {
  BackendStack,
  CacheStack,
  DatabaseStack,
  S3Stack,
  SharedStack,
} from "@stacks";
import { SSTConfig } from "sst";

const config: SSTConfig = {
  config(_input) {
    return {
      name: "chatesv",
      region: "us-east-1",
      bootstrap: {
        stackName: "chatesv-bootstrap",
      },
    };
  },
  stacks(app) {
    app
      .stack(SharedStack, {
        id: "shared-stack",
      })
      .stack(DatabaseStack, {
        id: "database-stack",
      })
      .stack(CacheStack, {
        id: "cache-stack",
      })
      .stack(S3Stack, {
        id: "s3-stack",
      })
      .stack(BackendStack, {
        id: "backend-stack-2",
      });
  },
};

export default config;
