import { publicBucket } from "./buckets";

export const website = new sst.aws.SolidStart("Website", {
  path: "apps/website",
  link: [publicBucket],
});
