import { Injectable } from "@nestjs/common";
import * as _ from 'lodash';
import { Telegraf } from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import { AssetService } from '../../modules/asset/asset.service';
import { YahooService } from '../../modules/yahoo/yahoo.service';
import PromisePool = require('@supercharge/promise-pool');

type TickerStatus = 'remove' | 'not_found';

@Injectable()
export class RemoveTickerCommand implements BotPlugin {

	constructor(
		private assetService: AssetService,
		private yahooService: YahooService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('remove', async ctx => {
			const args = ctx.state.command.splitArgs;

			const removeTickers = _.uniq(args.filter(t => !!t).map(t => t.toUpperCase()));

			if (!removeTickers?.length) {
				await ctx.reply(ctx.i18n.t('commands.remove-ticker.no-ticker-specified'));
				return;
			}

			const tickers = ctx.session.subscriptionTickers ?? [];


			const poolResult = await PromisePool
				.for(removeTickers)
				.withConcurrency(10)
				.process<{ ticker: string, status: TickerStatus }>(async t => {
					const exists = tickers.includes(t);

					if (!exists) {
						return {
							ticker: t,
							status: 'not_found',
						};
					}

					return {
						ticker: t,
						status: 'remove',
					};
				});

			const tickersToRemove = poolResult.results.filter(r => r.status === 'remove').map(r => r.ticker);
			const tickersNotFound = poolResult.results.filter(r => r.status === 'not_found').map(r => r.ticker);


			if (tickersNotFound.length) {
				await ctx.reply(
					ctx.i18n.t('commands.remove-ticker.not-found', { ticker: tickersNotFound.join(', ') })
				);
			}

			if (tickersToRemove.length) {
				const newTickers = _.without(tickers, ...tickersToRemove).sort();
				ctx.session.subscriptionTickers = newTickers;

				await ctx.reply(
					ctx.i18n.t('commands.remove-ticker.success', { ticker: tickersToRemove.join(', ') })
				);
			}
		})
	}



}
