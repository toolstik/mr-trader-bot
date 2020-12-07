import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';

@Injectable()
export class AddTickerCommand implements BotPlugin {

	register(bot: Telegraf<MyContext>) {
		bot.command('add', async ctx => {
			let ticker = ctx.state.command.splitArgs[0];

			if (!ticker) {
				await ctx.reply(ctx.i18n.t('commands.add-ticker.no-ticker-specified'));
				return;
			}

			ticker = ticker.toUpperCase();

			const tickers = ctx.session.subscriptionTickers ?? [];

			if (tickers.includes(ticker)) {
				await ctx.reply(ctx.i18n.t('commands.add-ticker.duplicate'));
				return;
			}

			ctx.session.subscriptionTickers = [...tickers, ticker];

			await ctx.reply(ctx.i18n.t('commands.add-ticker.success', { ticker }));
		})
	}



}
