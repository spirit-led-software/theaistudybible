import { RDS, RDSProps, StackContext } from "sst/constructs";

export function Database({ stack }: StackContext) {
  const devConfig: RDSProps["scaling"] = {
    minCapacity: "ACU_2",
    maxCapacity: "ACU_2",
    autoPause: true,
  };

  const prodConfig: RDSProps["scaling"] = {
    minCapacity: "ACU_2",
    maxCapacity: "ACU_64",
    autoPause: 30, // TODO: Change this to false when we have more consistent traffic
  };

  const database = new RDS(stack, "database", {
    defaultDatabaseName: "revelationsai",
    engine: "postgresql13.9",
    scaling: stack.stage === "prod" ? prodConfig : devConfig,
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
