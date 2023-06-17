import { S3Client } from '@aws-sdk/client-s3';
import { S3Config } from '@configs/types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly config: S3Config;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('s3');
  }

  getClient = () => {
    return new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  };

  getConfig = () => {
    return this.config;
  };
}
