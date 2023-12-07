import {
  API,
  Auth,
  ChatAPI,
  Constants,
  Crons,
  DatabaseScripts,
  Layers,
  Queues,
  S3,
  Website
} from '@stacks';
import { SSTConfig } from 'sst';
import { RestAPI } from './stacks/Rest-API';

export default {
  config() {
    return {
      name: 'revelationsai',
      region: 'us-east-1'
    };
  },
  async stacks(app) {
    app
      .stack(Constants)
      .stack(Layers)
      .stack(DatabaseScripts)
      .stack(S3)
      .stack(Queues)
      .stack(ChatAPI)
      .stack(API)
      .stack(RestAPI)
      .stack(Auth)
      .stack(Website)
      .stack(Crons);

    // This was removed because of extreme slowness in cold starts
    // // Add New Relic to all functions
    // if (!app.local && app.stage === "prod") {
    //   await app.finish();

    //   app.node.children.forEach((stack) => {
    //     if (stack instanceof Stack) {
    //       const newRelicLayer = LayerVersion.fromLayerVersionArn(
    //         stack,
    //         "NewRelicLayer",
    //         // Find the right ARN here: https://layers.newrelic-external.com/
    //         "arn:aws:lambda:us-east-1:451483290750:layer:NewRelicNodeJS18X:45"
    //       );
    //       const policy = new PolicyStatement({
    //         actions: ["secretsmanager:GetSecretValue"],
    //         effect: Effect.ALLOW,
    //         resources: [process.env.NEW_RELIC_LICENSE_KEY_SECRET_ARN!],
    //       });

    //       stack.getAllFunctions().forEach((fn) => {
    //         const cfnFunction = fn.node.defaultChild as CfnFunction;
    //         if (
    //           cfnFunction.handler &&
    //           !(cfnFunction.tags.tagValues()["newrelic-ignore"] === "true")
    //         ) {
    //           fn.addLayers(newRelicLayer);
    //           fn.addEnvironment(
    //             "NEW_RELIC_LAMBDA_HANDLER",
    //             cfnFunction.handler
    //           );
    //           fn.addEnvironment("NEW_RELIC_USE_ESM", "true");
    //           fn.addEnvironment(
    //             "NEW_RELIC_ACCOUNT_ID",
    //             process.env.NEW_RELIC_ACCOUNT_ID!
    //           );
    //           // Same as account ID unless we are using sub-accounts
    //           fn.addEnvironment(
    //             "NEW_RELIC_TRUSTED_ACCOUNT_KEY",
    //             process.env.NEW_RELIC_TRUSTED_ACCOUNT_KEY!
    //           );

    //           // Give functions access to the secret containing New Relic license key
    //           // More info: https://docs.newrelic.com/docs/serverless-function-monitoring/aws-lambda-monitoring/enable-lambda-monitoring/account-linking/
    //           fn.attachPermissions([policy]);

    //           // https://github.com/newrelic/newrelic-lambda-layers#manual-instrumentation-using-layers
    //           cfnFunction.handler = "newrelic-lambda-wrapper.handler";
    //         }
    //       });
    //     }
    //   });
    // }
  }
} satisfies SSTConfig;
