import { IndexOperation } from '@entities/index-op';
import { S3Module } from '@modules/s3/s3.module';
import { VectorDBModule } from '@modules/vector-db/vector-db.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileScraperService } from './file-scraper.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IndexOperation]),
    VectorDBModule,
    S3Module,
  ],
  providers: [FileScraperService],
  exports: [FileScraperService],
})
export class FileScraperModule {}
