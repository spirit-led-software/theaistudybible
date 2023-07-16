import { Auth as AuthConstruct, StackContext } from "sst/constructs";

export function Auth({ stack }: StackContext) {
  const auth = new AuthConstruct(stack, "Auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
    },
  });

  return {
    auth,
  };
}
