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
  ],
  controllers: [IndexController],
  providers: [IndexService],
})
export class IndexModule {}
