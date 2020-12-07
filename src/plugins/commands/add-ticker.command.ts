import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';

@Injectable()
export class AddTickerCommand implements BotPlugin {

	register(bot: Telegraf<MyContext>) {
		bot.command('add', async ctx => {
			const args = ctx.state.command.splitArgs;

			const addTickers = args.filter(t => !!t).map(t => t.toUpperCase());

			if (!addTickers?.length) {
				await ctx.reply(ctx.i18n.t('commands.add-ticker.no-ticker-specified'));
				return;
			}

			const tickers = ctx.session.subscriptionTickers ?? [];

			const newTickers = _.uniq([...tickers, ...addTickers]).sort();

			const realAdded = _.without(addTickers, ...tickers);

			if (!realAdded.length) {
				await ctx.reply(ctx.i18n.t('commands.add-ticker.duplicate'));
				return;
			}

			ctx.session.subscriptionTickers = newTickers;

			await ctx.reply(ctx.i18n.t('commands.add-ticker.success', { ticker: realAdded.join(', ') }));
		})
	}



}
