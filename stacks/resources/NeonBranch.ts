import { STATIC_ENV_VARS } from "@stacks";
import { CustomResource } from "aws-cdk-lib";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { Function } from "sst/constructs";

export type NeonBranchProps = {
  isProd: boolean;
  projectName: string;
  branchName: string;
  roleName: string;
};

export class NeonBranch extends Construct {
  public readonly projectId: string;

  public readonly dbReadOnlyUrl: string;
  public readonly dbReadWriteUrl: string;

  public readonly vectorDbReadOnlyUrl: string;
  public readonly vectorDbReadWriteUrl: string;

  constructor(scope: Construct, id: string, props: NeonBranchProps) {
    super(scope, id);

    const neonBranchFunction = new Function(this, "neonBranchFunction", {
      handler: "packages/functions/src/database/branch.handler",
      environment: {
        ...STATIC_ENV_VARS,
      },
      runtime: "nodejs18.x",
      architecture: "x86_64",
      enableLiveDev: false, // No live dev on custom resources
    });

    const neonBranchProvider = new Provider(this, "neonBranchProvider", {
      onEventHandler: neonBranchFunction,
    });

    const neonBranchCustomResource = new CustomResource(
      this,
      "neonBranchCustomResource",
      {
        resourceType: "Custom::NeonBranch",
        serviceToken: neonBranchProvider.serviceToken,
        properties: {
          isProd: props.isProd,
          projectName: props.projectName,
          branchName: props.branchName,
          roleName: props.roleName,
        },
      }
    );
    this.projectId = neonBranchCustomResource.getAttString("projectId");

    this.dbReadOnlyUrl = neonBranchCustomResource.getAttString("dbReadOnlyUrl");
    this.dbReadWriteUrl =
      neonBranchCustomResource.getAttString("dbReadWriteUrl");

    this.vectorDbReadOnlyUrl = neonBranchCustomResource.getAttString(
      "vectorDbReadOnlyUrl"
    );
    this.vectorDbReadWriteUrl = neonBranchCustomResource.getAttString(
      "vectorDbReadWriteUrl"
    );
  }
}
