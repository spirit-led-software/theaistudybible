import { CustomResource } from "aws-cdk-lib";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { Function } from "sst/constructs";

export type NeonBranchProps = {
  isProd: boolean;
  projectName: string;
  branchName: string;
  roleName: string;
  apiKey: string;
};

export type NeonDatabases = {
  dbReadOnlyUrl: string;
  dbReadWriteUrl: string;
  vectorDbReadOnlyUrl: string;
  vectorDbReadWriteUrl: string;
};

export class NeonBranch extends Construct {
  public readonly projectId: string;

  public readonly urls: NeonDatabases;

  constructor(scope: Construct, id: string, props: NeonBranchProps) {
    super(scope, id);

    const neonBranchFunction = new Function(this, "neonBranchFunction", {
      handler: "packages/functions/src/database/branch.handler",
      environment: {
        DEPLOY_DATE_TIME: Date.now().toString(), // Force update on every deploy
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
          apiKey: props.apiKey,
          deployDateTime: Date.now().toString(), // Force update on every deploy
        },
      }
    );

    this.projectId = neonBranchCustomResource.getAttString("projectId");

    this.urls = {
      dbReadOnlyUrl: neonBranchCustomResource.getAttString("dbReadOnlyUrl"),
      dbReadWriteUrl: neonBranchCustomResource.getAttString("dbReadWriteUrl"),
      vectorDbReadOnlyUrl: neonBranchCustomResource.getAttString(
        "vectorDbReadOnlyUrl"
      ),
      vectorDbReadWriteUrl: neonBranchCustomResource.getAttString(
        "vectorDbReadWriteUrl"
      ),
    };
  }
}
