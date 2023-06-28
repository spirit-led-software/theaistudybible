import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { middleware } from 'supertokens-node/framework/express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(this.constructor.name);
  private readonly supertokensMiddleware;

  constructor() {
    this.supertokensMiddleware = middleware();
    this.logger.log('Initialized Supertokens Middleware');
  }

  use(req: Request, res: any, next: () => void) {
    return this.supertokensMiddleware(req, res, next);
  }
}
