import { IndexOperation } from '@entities/index-op';
import { VectorDBModule } from '@modules/vector-db/vector-db.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebScraperService } from './web-scraper.service';

@Module({
  imports: [TypeOrmModule.forFeature([IndexOperation]), VectorDBModule],
  providers: [WebScraperService],
  exports: [WebScraperService],
})
export class WebScraperModule {}
