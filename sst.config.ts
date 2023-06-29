import { AuthStack, BackendStack, SharedStack } from "@stacks";
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
      .stack(AuthStack, {
        id: "auth-stack",
      })
      .stack(BackendStack, {
        id: "backend-stack",
      });
  },
};

export default config;
