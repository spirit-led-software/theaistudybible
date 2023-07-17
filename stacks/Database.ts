import { RDS, StackContext } from "sst/constructs";

export function Database({ stack }: StackContext) {
  const database = new RDS(stack, "Database", {
    defaultDatabaseName: "chatesv",
    engine: "postgresql13.9",
  });

  stack.addOutputs({
    "Database Resource ARN": database.clusterArn,
    "Database Secret ARN": database.secretArn,
    "Database Name": database.defaultDatabaseName,
  });

  return {
    database,
  };
}
