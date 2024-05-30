import { publicBucket } from "./buckets";
import { domainName } from "./constants";

export let cdnRouter: sst.aws.Router | undefined = undefined;
// Create cloudfront distribution for non-dev environments
if ($app.stage === "prod") {
  cdnRouter = new sst.aws.Router("CDNRouter", {
    domain: `cdn.${domainName}`,
    routes: {
      "/*": publicBucket.nodes.bucket.bucketRegionalDomainName,
    },
  });
}
