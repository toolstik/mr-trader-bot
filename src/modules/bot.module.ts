import { Module } from '@nestjs/common';

import { FirebaseSessionMiddleware } from '../middlewares/firebase-session.middleware';
import { BotUpdate } from './bot.update';
import { AddTickerModule } from './commands/add-ticker/add-ticker.module';
import { AddTickerListModule } from './commands/add-ticker-list/add-ticker-list.module';
import { ListTickerModule } from './commands/list-ticker/list-ticker.module';
import { RemoveTickerModule } from './commands/remove-ticker/remove-ticker.module';
import { TestTickerModule } from './commands/test-ticker/test-ticker.module';
import { FirebaseModule } from './firebase/firebase.module';
import { FirebaseService } from './firebase/firebase.service';

@Module({
  imports: [
    AddTickerModule,
    AddTickerListModule,
    FirebaseModule,
    ListTickerModule,
    RemoveTickerModule,
    TestTickerModule,
  ],
  providers: [BotUpdate, FirebaseService, FirebaseSessionMiddleware],
  exports: [FirebaseSessionMiddleware],
})
export class BotModule {}
