import { RDS, StackContext } from "sst/constructs";

export function Database({ stack }: StackContext) {
  const database = new RDS(stack, "Database", {
    defaultDatabaseName: "chatesv",
    engine: "postgresql13.9",
  });

  const databaseUrl = `postgresql://${database.cdk.cluster.secret?.secretValueFromJson(
    "username"
  )}:${database.cdk.cluster.secret?.secretValueFromJson("password")}@${
    database.clusterEndpoint.hostname
  }:${database.clusterEndpoint.port}/chatesv?sslmode=require`;

  stack.addOutputs({
    "Database ID": database.clusterIdentifier,
  });

  return {
    database,
  };
}
