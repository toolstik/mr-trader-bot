import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import * as TelegrafSessionFirebase from 'telegraf-session-firebase';
import { MyContext } from '../types/my-context';
import { FirebaseService } from "../services/firebase.service";
import { BotPlugin } from '../types/bot-plugin';

@Injectable()
export class SessionPlugin implements BotPlugin {


	constructor(private firebase: FirebaseService) {

	}

	register(bot: Telegraf<MyContext>) {
		const database = this.firebase.getDatabase();
		const databaseSession = TelegrafSessionFirebase(database.ref('sessions'));
		bot.use(databaseSession);
		bot.on('text', (ctx, next) => {
			ctx.session = {
				...ctx.session,
				username: ctx.chat.username ?? '',
				chatId: ctx.chat.id,
				enabled: ctx.session?.enabled ?? true,
				subscriptionTickers: ctx.session?.subscriptionTickers ?? [],
			};
			return next()
		});
	}



}
