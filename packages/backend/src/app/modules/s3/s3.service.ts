import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3Config } from '@configs/types';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(this.constructor.name);

  private readonly config: S3Config;
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('s3');
    this.client = new S3Client({
      region: this.config.region,
    });
  }

  downloadObject = async (key: string) => {
    const getObjectCommand = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });
    const result = await this.client.send(getObjectCommand);
    this.logger.log(`File '${key}' fetched from S3`);
    return result;
  };

  uploadObject = async (
    key: string,
    body: Buffer,
    metadata?: Record<string, string>,
  ) => {
    const uploadCommand = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: body,
      Metadata: metadata,
    });
    const result = await this.client.send(uploadCommand);
    this.logger.log(`File '${key}' uploaded to S3`);
    return result;
  };
}
