import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Config } from "@core/configs";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validApiHandlerSession } from "@services/session";
import { isAdminSync } from "@services/user";
import { ApiHandler } from "sst/node/api";

const s3Client = new S3Client({});

export const handler = ApiHandler(async (event) => {
  console.log("Received index file url generation event:", event);

  const { name, url, fileName, fileType } = JSON.parse(event.body || "{}");

  if (!name || !url || !fileName || !fileType) {
    return BadRequestResponse("Missing required fields");
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid || !isAdminSync(userWithRoles)) {
      return UnauthorizedResponse();
    }

    const s3Url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        ACL: "public-read",
        ContentType: fileType,
        Bucket: s3Config.indexFileBucket,
        Key: fileName,
        Metadata: {
          name,
          url,
        },
      })
    );

    return OkResponse({
      url: s3Url,
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});
