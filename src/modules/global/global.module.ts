import { Global, Logger, Module } from '@nestjs/common';

import { ResponseTimeMiddleware } from '../../middlewares/request-time.middleware';
import { Configuration } from './configuration';
import { EventEmitterService } from './event-emitter.service';
import { FirebaseLogger } from './firebase-logger';

@Global()
@Module({
  providers: [
    Configuration,
    ResponseTimeMiddleware,
    EventEmitterService,
    FirebaseLogger,
    {
      provide: Logger,
      inject: [Configuration, FirebaseLogger],
      useFactory: (config: Configuration, fbLogger: FirebaseLogger) => {
        return config.isEmulator ? new Logger() : fbLogger;
      },
    },
  ],
  exports: [Configuration, ResponseTimeMiddleware, Logger, EventEmitterService],
})
export class GlobalModule {}
