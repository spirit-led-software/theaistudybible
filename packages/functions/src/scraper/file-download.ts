import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { axios, s3Config } from "@core/configs";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
} from "@lib/api-responses";
import path from "path";
import { ApiHandler } from "sst/node/api";

const s3Client = new S3Client({});

export const handler = ApiHandler(async (event) => {
  console.log("Received file download event:", event);

  const {
    name,
    url,
    metadata = {},
  }: { name: string; url: string; metadata?: any } = JSON.parse(
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

    const { filename, contentType } = getFileNameAndContentTypeFromUrl(url);
    const putCommandResponse = await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Config.indexFileBucket,
        Key: filename,
        ContentType: contentType,
        Body: downloadResponse.data,
        Metadata: {
          ...metadata,
          name,
          url,
        },
      })
    );

    if (
      !putCommandResponse.$metadata?.httpStatusCode ||
      putCommandResponse.$metadata?.httpStatusCode !== 200
    ) {
      return InternalServerErrorResponse("Error uploading file to S3");
    }

    return OkResponse({
      body: "Success",
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
});

function getFileNameAndContentTypeFromUrl(url: string): {
  filename: string;
  contentType?: string;
} {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const contentType = path.extname(filename).replace(".", "") || undefined;
  return { filename, contentType };
}
