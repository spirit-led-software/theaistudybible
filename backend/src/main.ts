import { SupertokensExceptionFilter } from '@modules/auth/auth.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import supertokens from 'supertokens-node';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.enableCors({
    origin: ['http://localhost:3000', 'https://chatesv.com'],
    allowedHeaders: ['Content-Type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  });
  const globalPrefix = process.env.API_BASE_PATH || '/api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new SupertokensExceptionFilter());
  const port = process.env.PORT || 8080;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}${globalPrefix}`,
    'Main',
  );
}

bootstrap();
