import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { SessionMiddleware } from './session.middleware';
import { SupertokensService } from './supertokens.service';

@Module({})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
    consumer.apply(SessionMiddleware).forRoutes('*');
  }

  static forRoot(): DynamicModule {
    return {
      module: AuthModule,
      providers: [SupertokensService],
      exports: [SupertokensService],
    };
  }
}
