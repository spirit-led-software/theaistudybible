import { Module } from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';

@Module({
  providers: [WebScraperService],
  exports: [WebScraperService],
})
export class WebScraperModule {}
