import { Module } from '@nestjs/common';
import { SessionMiddleware } from '../middlewares/session.middleware';
import { FirebaseService } from './firebase/firebase.service';
import { AddTickerModule } from './commands/add-ticker/add-ticker.module';
import { BotUpdate } from './bot.update';
import { AddTickerListModule } from './commands/add-ticker-list/add-ticker-list.module';

@Module({
	imports: [
		AddTickerModule,
		AddTickerListModule,
	],
	providers: [
		BotUpdate,
		FirebaseService,
		SessionMiddleware,
	],
	exports: [SessionMiddleware],
})
export class BotModule { }
