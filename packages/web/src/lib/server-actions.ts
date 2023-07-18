"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import s3Config from "@configs/s3";

export const login = async (id: string, email?: string) => {
  
};

export const uploadIndexFileToS3 = async (data: FormData) => {
  const name = data.get("name") as string;
  const url = data.get("url") as string;
  const file = data.get("file") as File;

  const s3Client = new S3Client({});
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
    throw new Error("Failed to upload file to S3");
  }
};
