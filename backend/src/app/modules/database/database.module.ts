import { typeormConfig } from '@configs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(typeormConfig)],
})
export class DatabaseModule {}
