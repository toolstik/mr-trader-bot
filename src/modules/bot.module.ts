import { Module } from '@nestjs/common';
import { SessionMiddleware } from '../middlewares/session.middleware';
import { FirebaseService } from './firebase/firebase.service';
import { AddTickerModule } from './add-ticker/add-ticker.module';
import { BotUpdate } from './bot.update';

@Module({
	imports: [
		AddTickerModule,
	],
	providers: [
		BotUpdate,
		FirebaseService,
		SessionMiddleware,
	],
	exports: [SessionMiddleware],
})
export class BotModule { }
