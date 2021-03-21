import { Global, Logger, Module } from '@nestjs/common';

import { ResponseTimeMiddleware } from '../../middlewares/request-time.middleware';
import { ConfigService } from './config.service';
import { EventEmitterService } from './event-emitter.service';

@Global()
@Module({
  providers: [
    ConfigService,
    ResponseTimeMiddleware,
    EventEmitterService,
    {
      provide: Logger,
      useClass: Logger,
    },
  ],
  exports: [ConfigService, ResponseTimeMiddleware, Logger, EventEmitterService],
})
export class GlobalModule {}
