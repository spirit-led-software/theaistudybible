import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { axios, s3Config } from "@core/configs";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
} from "@lib/api-responses";
import { ApiHandler } from "sst/node/api";

const s3Client = new S3Client({});

export const handler = ApiHandler(async (event) => {
  console.log("Received file download event:", event);

  const {
    name,
    url,
    metadata = "{}",
  }: { name: string; url: string; metadata?: string } = JSON.parse(
    event.body || "{}"
  );

  if (!name || !url) {
    return BadRequestResponse("Missing required fields");
  }

  try {
    const downloadResponse = await axios.get(url, {
      decompress: false,
      responseType: "arraybuffer",
    });

    const filename = getFileNameFromUrl(url);
    const contentType = downloadResponse.headers["content-type"];
    const putCommandResponse = await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Config.indexFileBucket,
        Key: filename,
        ContentType: contentType,
        Body: downloadResponse.data,
        Metadata: {
          ...JSON.parse(metadata),
          name,
          url,
        },
      })
    );

    if (
      !putCommandResponse.$metadata?.httpStatusCode ||
      putCommandResponse.$metadata?.httpStatusCode !== 200
    ) {
      return InternalServerErrorResponse(
        `Failed to upload file to S3 ${putCommandResponse.$metadata?.httpStatusCode}`
      );
    }

    return OkResponse({
      body: "Success",
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});

function getFileNameFromUrl(url: string) {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  return filename;
}
