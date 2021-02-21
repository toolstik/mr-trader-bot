import { Injectable } from "@nestjs/common";
import * as _ from 'lodash';
import { Telegraf } from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import { AssetService } from './../../services/asset.service';
import { YahooService } from './../../services/yahoo.service';
import PromisePool = require('@supercharge/promise-pool');

@Injectable()
export class AddTickerCommand implements BotPlugin {

	constructor(
		private assetService: AssetService,
		private yahooService: YahooService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('add', async ctx => {
			const args = ctx.state.command.splitArgs;

			const addTickers = args.filter(t => !!t).map(t => t.toUpperCase());

			if (!addTickers?.length) {
				await ctx.reply(ctx.i18n.t('commands.add-ticker.no-ticker-specified'));
				return;
			}

			const tickers = ctx.session.subscriptionTickers ?? [];
			const reallyNew = _.without(addTickers, ...tickers);

			if (!reallyNew.length) {
				await ctx.reply(ctx.i18n.t('commands.add-ticker.duplicate'));
				return;
			}

			const poolResult = await PromisePool
				.for(reallyNew)
				.withConcurrency(10)
				.process(async t => {
					const asset = await this.assetService.getOne(t);
					const price = await this.yahooService.getPrices(t);

					if (!asset) {
						if (!price) {
							await ctx.reply(ctx.i18n.t('commands.add-ticker.not-found', { ticker: t }));
							return {
								ticker: t,
								apply: false,
							};
						}

						if (!price.regularMarketPrice) {
							await ctx.reply(ctx.i18n.t('commands.add-ticker.not-tradable', { ticker: t }));
							return {
								ticker: t,
								apply: false,
							};
						}
					}

					return {
						ticker: t,
						apply: true,
					};
				});

			const tickersToAdd = poolResult.results.filter(r => r.apply).map(r => r.ticker);

			if (tickersToAdd.length) {
				const newTickers = _.uniq([...tickers, ...tickersToAdd]).sort();
				ctx.session.subscriptionTickers = newTickers;

				await this.assetService.updateHistory(tickersToAdd);

				await ctx.reply(ctx.i18n.t('commands.add-ticker.success', { ticker: tickersToAdd.join(', ') }));
			}
		})
	}



}
