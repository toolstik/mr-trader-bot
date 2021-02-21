import { Module } from '@nestjs/common';
import { SessionMiddleware } from '../middlewares/session.middleware';
import { FirebaseService } from '../services/firebase.service';
import { BotUpdate } from './bot.update';

@Module({
	providers: [
		BotUpdate,
		FirebaseService,
		SessionMiddleware,
	],
	exports: [SessionMiddleware],
})
export class BotModule { }
