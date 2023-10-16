import {
  API,
  Auth,
  Constants,
  Crons,
  DatabaseScripts,
  Queues,
  S3,
  Website,
} from "@stacks";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CfnFunction, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { SSTConfig } from "sst";
import { Stack } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "revelationsai",
      region: "us-east-1",
    };
  },
  async stacks(app) {
    const enableNR = !app.local;

    if (enableNR) {
      app.setDefaultFunctionProps((stack) => {
        const newRelicLayer = LayerVersion.fromLayerVersionArn(
          stack,
          "NewRelicLayer",
          // Find the right ARN here: https://layers.newrelic-external.com/
          "arn:aws:lambda:us-east-1:451483290750:layer:NewRelicNodeJS18X:45"
        );

        return {
          layers: [newRelicLayer.layerVersionArn],
        };
      });
    }

    app
      .stack(Constants)
      .stack(DatabaseScripts)
      .stack(S3)
      .stack(Queues)
      .stack(Auth)
      .stack(API)
      .stack(Website)
      .stack(Crons);

    if (enableNR) {
      await app.finish();

      app.node.children.forEach((stack) => {
        if (stack instanceof Stack) {
          const policy = new PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            effect: Effect.ALLOW,
            resources: [process.env.NEW_RELIC_LICENSE_KEY_SECRET_ARN!],
          });

          stack.getAllFunctions().forEach((fn) => {
            const cfnFunction = fn.node.defaultChild as CfnFunction;
            if (
              cfnFunction.handler &&
              !cfnFunction.functionName?.includes("chatApi")
            ) {
              fn.addEnvironment(
                "NEW_RELIC_LAMBDA_HANDLER",
                cfnFunction.handler
              );
              fn.addEnvironment("NEW_RELIC_USE_ESM", "true");
              fn.addEnvironment(
                "NEW_RELIC_ACCOUNT_ID",
                process.env.NEW_RELIC_ACCOUNT_ID!
              );
              // Same as account ID unless we are using sub-accounts
              fn.addEnvironment(
                "NEW_RELIC_TRUSTED_ACCOUNT_KEY",
                process.env.NEW_RELIC_TRUSTED_ACCOUNT_KEY!
              );
            }

            // Give functions access to the secret containing New Relic license key
            // More info: https://docs.newrelic.com/docs/serverless-function-monitoring/aws-lambda-monitoring/enable-lambda-monitoring/account-linking/
            fn.attachPermissions([policy]);

            // https://github.com/newrelic/newrelic-lambda-layers#manual-instrumentation-using-layers
            cfnFunction.handler = "newrelic-lambda-wrapper.handler";
          });
        }
      });
    }
  },
} satisfies SSTConfig;
