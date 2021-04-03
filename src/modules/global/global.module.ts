import { Global, Module } from '@nestjs/common';

import { ResponseTimeMiddleware } from '../../middlewares/request-time.middleware';
import { Configuration } from './configuration';
import { EventEmitterService } from './event-emitter.service';
import { FirebaseLogger } from './firebase-logger';
import { PlainLogger } from './plain-logger';

@Global()
@Module({
  providers: [
    Configuration,
    ResponseTimeMiddleware,
    EventEmitterService,
    FirebaseLogger,
    {
      provide: PlainLogger,
      inject: [Configuration, FirebaseLogger],
      useFactory: (config: Configuration, fbLogger: FirebaseLogger) => {
        return config.isEmulator ? new PlainLogger() : fbLogger;
      },
    },
  ],
  exports: [Configuration, ResponseTimeMiddleware, EventEmitterService, PlainLogger],
})
export class GlobalModule {}
