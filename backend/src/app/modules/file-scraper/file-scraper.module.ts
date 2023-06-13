import { Module } from '@nestjs/common';
import { FileScraperService } from './file-scraper.service';

@Module({
  providers: [FileScraperService],
  exports: [FileScraperService],
})
export class FileScraperModule {}
