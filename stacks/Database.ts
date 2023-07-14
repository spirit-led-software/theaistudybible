import { RDS, StackContext } from "sst/constructs";

export function Database({ stack }: StackContext) {
  const database = new RDS(stack, `${stack.stackName}-database`, {
    defaultDatabaseName: "chatesv",
    engine: "postgresql13.9",
    migrations: "prisma/migrations",
  });

  const databaseUrl = `postgresql://${database.cdk.cluster.secret?.secretValueFromJson(
    "username"
  )}:${database.cdk.cluster.secret?.secretValueFromJson("password")}@${
    database.clusterEndpoint.hostname
  }:${database.clusterEndpoint.port}/chatesv?sslmode=require`;

  return {
    database,
    databaseUrl,
  };
}
