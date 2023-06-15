import { FileScraperModule } from '@modules/file-scraper/file-scraper.module';
import { WebScraperModule } from '@modules/web-scraper/web-scraper.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexOperation } from '../../entities/index-op';
import { IndexOpController } from './index-op.controller';
import { IndexOpService } from './index-op.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IndexOperation]),
    BullModule.registerQueue({ name: 'indexOperations' }),
    WebScraperModule,
    FileScraperModule,
  ],
  controllers: [IndexOpController],
  providers: [IndexOpService],
})
export class IndexOpModule {}
