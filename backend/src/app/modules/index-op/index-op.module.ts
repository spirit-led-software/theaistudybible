import { S3Module } from '@modules/s3/s3.module';
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
    S3Module,
  ],
  controllers: [IndexOpController],
  providers: [IndexOpService],
})
export class IndexOpModule {}
