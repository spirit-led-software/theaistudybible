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
import { Fn } from "aws-cdk-lib";
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
          // Find your "<ARN>" here: https://layers.newrelic-external.com/
          "arn:aws:lambda:us-east-1:451483290750:layer:NewRelicNodeJS18X:43"
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

      // Loop through each stack in the app
      app.node.children.forEach((stack) => {
        if (stack instanceof Stack) {
          const policy = new PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            effect: Effect.ALLOW,
            resources: [
              Fn.importValue(
                "NewRelicLicenseKeySecret-NewRelic-LicenseKeySecretARN"
              ),
            ],
          });

          stack.getAllFunctions().forEach((fn) => {
            const cfnFunction = fn.node.defaultChild as CfnFunction;
            if (cfnFunction.handler) {
              fn.addEnvironment(
                "NEW_RELIC_LAMBDA_HANDLER",
                cfnFunction.handler
              );
              fn.addEnvironment(
                "NEW_RELIC_ACCOUNT_ID",
                process.env.NEW_RELIC_ACCOUNT_ID!
              );
              // If your New Relic account has a parent account, this value should be that account ID. Otherwise, just
              // your account id.
              fn.addEnvironment(
                "NEW_RELIC_TRUSTED_ACCOUNT_KEY",
                process.env.NEW_RELIC_TRUSTED_ACCOUNT_KEY!
              );
            }

            // Give your function access to the secret containing your New Relic license key
            // You will set this key using the `newrelic-lambda integrations install` command
            // More info: https://docs.newrelic.com/docs/serverless-function-monitoring/aws-lambda-monitoring/enable-lambda-monitoring/account-linking/
            fn.attachPermissions([policy]);

            // See #3 on the link below for the correct handler name to use based on your runtime
            // The handler name below is for NodeJS
            // https://github.com/newrelic/newrelic-lambda-layers#manual-instrumentation-using-layers
            cfnFunction.handler = "newrelic-lambda-wrapper.handler";
          });
        }
      });
    }
  },
} satisfies SSTConfig;
