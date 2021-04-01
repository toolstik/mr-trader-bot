import { Module } from '@nestjs/common';

import { FirebaseSessionMiddleware } from '../middlewares/firebase-session.middleware';
import { BotUpdate } from './bot.update';
import { AddTickerModule } from './commands/add-ticker/add-ticker.module';
import { AddTickerListModule } from './commands/add-ticker-list/add-ticker-list.module';
import { FundamentalsModule } from './commands/fundamentals/fundamentals.module';
import { ListTickerModule } from './commands/list-ticker/list-ticker.module';
import { NotifyModule } from './commands/notify/notify.module';
import { RemoveTickerModule } from './commands/remove-ticker/remove-ticker.module';
import { RemoveTickerListModule } from './commands/remove-ticker-list/remove-ticker-list.module';
import { StatisticsModule } from './commands/statistics/statistics.module';
import { StatusModule } from './commands/status/status.module';
import { TestTickerModule } from './commands/test-ticker/test-ticker.module';
import { UpdateModule } from './commands/update/update.module';
import { UpdateHistoryModule } from './commands/update-history/update-history.module';
import { FirebaseModule } from './firebase/firebase.module';
import { StatusTransitionModule } from './status-transition/status-transition.module';

@Module({
  imports: [
    //commands
    AddTickerModule,
    AddTickerListModule,
    FundamentalsModule,
    ListTickerModule,
    NotifyModule,
    RemoveTickerModule,
    RemoveTickerListModule,
    StatisticsModule,
    StatusModule,
    TestTickerModule,
    UpdateHistoryModule,
    UpdateModule,

    FirebaseModule,
    StatusTransitionModule,
  ],
  providers: [BotUpdate, FirebaseSessionMiddleware],
  exports: [FirebaseSessionMiddleware],
})
export class BotModule {}
