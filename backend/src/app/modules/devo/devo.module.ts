import { SourceDocument } from '@modules/query/entities/source-document.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevoController } from './devo.controller';
import { DevoService } from './devo.service';
import { Devo } from './entities/devo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Devo, SourceDocument])],
  controllers: [DevoController],
  providers: [DevoService],
})
export class DevoModule {}
