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
import { ApiHandler } from "sst/node/api";

const s3Client = new S3Client({});

export const handler = ApiHandler(async (event) => {
  console.log("Received profile picture url generation event:", event);

  const { fileType } = JSON.parse(event.body || "{}");
  if (!fileType) {
    return BadRequestResponse("Missing fileType");
  }

  try {
    const { isValid, userWithRoles } = await validApiHandlerSession();
    if (!isValid) {
      return UnauthorizedResponse();
    }

    const s3Url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        ACL: "public-read",
        ContentType: fileType,
        Bucket: s3Config.userProfilePictureBucket,
        Key: `${userWithRoles.id}-${Date.now()}`,
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
