import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthMiddleware } from './auth.middleware.js';

@Module({
  controllers: [AuthController],
  providers: [],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'api/auth/(.*)', method: RequestMethod.ALL },
        { path: 'api/docs', method: RequestMethod.GET },
        { path: 'api/docs-json', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
