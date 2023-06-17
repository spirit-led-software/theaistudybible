import { S3Module } from '@modules/s3/s3.module';
import { VectorDBModule } from '@modules/vector-db/vector-db.module';
import { Module } from '@nestjs/common';
import { FileScraperService } from './file-scraper.service';

@Module({
  imports: [VectorDBModule, S3Module],
  providers: [FileScraperService],
  exports: [FileScraperService],
})
export class FileScraperModule {}
