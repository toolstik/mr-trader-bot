import { Injectable } from "@nestjs/common";
import { Composer } from 'telegraf';
import * as TelegrafSessionFirebase from 'telegraf-session-firebase';
import { MiddlewareObj } from "telegraf/typings/middleware";
import { FirebaseService } from "../modules/firebase/firebase.service";
import { MyContext } from '../types/my-context';

@Injectable()
export class SessionMiddleware implements MiddlewareObj<MyContext> {
	constructor(private firebase: FirebaseService) {

	}

	middleware() {
		const database = this.firebase.getDatabase();
		const databaseSession = TelegrafSessionFirebase(database.ref('sessions'));

		return Composer.compose<MyContext>([
			databaseSession,
			Composer.on('text', (ctx: MyContext, next) => {
				ctx.session = {
					...ctx.session,
					username: ctx.message.from.username ?? '',
					chatId: ctx.chat.id,
					enabled: ctx.session?.enabled ?? true,
					subscriptionTickers: ctx.session?.subscriptionTickers ?? [],
				};

				return next()
			}),
		]);
	}

}
