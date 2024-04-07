import { CustomResource } from 'aws-cdk-lib';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import type { BranchCreateRequestEndpointOptions } from 'neon-sdk';
import { Function } from 'sst/constructs';

export type NeonBranchProps = {
  apiKey: string;
  projectName: string;
  branchName: string;
  roleName: string;
  endpointOptions?: BranchCreateRequestEndpointOptions[];
  retainOnDelete?: boolean;
};

export type NeonDatabases = {
  readOnlyUrl: string;
  readWriteUrl: string;
};

export class NeonBranch extends Construct {
  public readonly projectId: string;

  public readonly urls: NeonDatabases;

  constructor(scope: Construct, id: string, props: NeonBranchProps) {
    super(scope, id);

    const neonBranchFunction = new Function(this, 'NeonBranchFunction', {
      handler: 'packages/functions/src/database/neon-branch.handler',
      enableLiveDev: false // No live dev on custom resources
    });

    const neonBranchProvider = new Provider(this, 'NeonBranchProvider', {
      onEventHandler: neonBranchFunction
    });

    const neonBranchCustomResource = new CustomResource(this, 'NeonBranchCustomResource', {
      resourceType: 'Custom::NeonBranch',
      serviceToken: neonBranchProvider.serviceToken,
      properties: {
        apiKey: props.apiKey,
        projectName: props.projectName,
        branchName: props.branchName,
        roleName: props.roleName,
        endpointOptions: JSON.stringify(props.endpointOptions ?? []),
        retainOnDelete: props.retainOnDelete ?? true
      }
    });

    this.projectId = neonBranchCustomResource.getAttString('projectId');

    this.urls = {
      readOnlyUrl: neonBranchCustomResource.getAttString('readOnlyUrl'),
      readWriteUrl: neonBranchCustomResource.getAttString('readWriteUrl')
    };
  }
}
