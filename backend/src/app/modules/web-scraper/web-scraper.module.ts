import { VectorDBModule } from '@modules/vector-db/vector-db.module';
import { Module } from '@nestjs/common';
import { WebScraperService } from './web-scraper.service';

@Module({
  imports: [VectorDBModule],
  providers: [WebScraperService],
  exports: [WebScraperService],
})
export class WebScraperModule {}
