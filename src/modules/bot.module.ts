import { Module } from '@nestjs/common';

import { SessionMiddleware } from '../middlewares/session.middleware';
import { BotUpdate } from './bot.update';
import { AddTickerModule } from './commands/add-ticker/add-ticker.module';
import { AddTickerListModule } from './commands/add-ticker-list/add-ticker-list.module';
import { ListTickerModule } from './commands/list-ticker/list-ticker.module';
import { RemoveTickerModule } from './commands/remove-ticker/remove-ticker.module';
import { FirebaseService } from './firebase/firebase.service';

@Module({
  imports: [AddTickerModule, AddTickerListModule, RemoveTickerModule, ListTickerModule],
  providers: [BotUpdate, FirebaseService, SessionMiddleware],
  exports: [SessionMiddleware],
})
export class BotModule {}
