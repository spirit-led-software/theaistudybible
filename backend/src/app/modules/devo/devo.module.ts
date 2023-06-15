import { Devo, SourceDocument } from '@entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevoController } from './devo.controller';
import { DevoService } from './devo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Devo, SourceDocument])],
  controllers: [DevoController],
  providers: [DevoService],
})
export class DevoModule {}
