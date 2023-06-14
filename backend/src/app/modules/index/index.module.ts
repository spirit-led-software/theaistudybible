import { FileScraperModule } from '@modules/file-scraper/file-scraper.module';
import { WebScraperModule } from '@modules/web-scraper/web-scraper.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexOperation } from './entities/index-operation.entity';
import { IndexController } from './index.controller';
import { IndexService } from './index.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IndexOperation]),
    BullModule.registerQueue({ name: 'indexOperations' }),
    WebScraperModule,
    FileScraperModule,
  ],
  controllers: [IndexController],
  providers: [IndexService],
})
export class IndexModule {}
