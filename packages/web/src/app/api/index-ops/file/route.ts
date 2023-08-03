import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { s3Config } from "@core/configs";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
} from "@lib/api-responses";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.formData();
  const name = data.get("name") as string;
  const url = data.get("url") as string;
  const file = data.get("file") as File;

  if (!name || !url || !file) {
    return BadRequestResponse("Missing required fields");
  }

  try {
    const putObjectCommand = new PutObjectCommand({
      Bucket: s3Config.indexFileBucket,
      Key: file.name,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      Metadata: {
        name,
        url,
      },
    });

    const putRequest = await s3Client.send(putObjectCommand);
    if (putRequest.$metadata.httpStatusCode !== 200) {
      throw new Error(`Failed to upload file to S3: ${putRequest.$metadata}`);
    }
    console.log("Successfully uploaded file to S3:", putRequest.$metadata);
    return OkResponse({
      message: "Successfully uploaded file to S3",
    });
  } catch (error) {
    console.error(error);
    return InternalServerErrorResponse();
  }
}
