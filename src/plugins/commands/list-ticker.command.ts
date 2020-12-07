import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';

@Injectable()
export class ListTickerCommand implements BotPlugin {

	register(bot: Telegraf<MyContext>) {
		bot.command('list', async ctx => {
			const tickers = ctx.session.subscriptionTickers ?? [];

			await ctx.reply(ctx.i18n.t('commands.list-ticker.success', { tickers: tickers.join(', ') }));
		})
	}



}
