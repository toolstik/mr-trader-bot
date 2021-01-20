import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';
import { paginate } from "../../types/commons";

@Injectable()
export class ListTickerCommand implements BotPlugin {

	register(bot: Telegraf<MyContext>) {
		bot.command('list', async ctx => {
			const tickers = ctx.session.subscriptionTickers ?? [];

			const pages = paginate(tickers, 300);

			await ctx.reply(ctx.i18n.t('commands.list-ticker.success'));

			for (const p of pages) {
				await ctx.reply(p.items.join(', '));
			}
		})
	}



}
