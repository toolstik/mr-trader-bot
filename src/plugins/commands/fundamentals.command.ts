import { NotificationService } from '../../services/notification.service';
import { BotService } from '../../services/bot.service';
import { AssetService } from '../../modules/asset/asset.service';
import { AnalysisService } from '../../services/analysis.service';
import { Injectable } from "@nestjs/common";
import { Telegraf } from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';
import PromisePool = require('@supercharge/promise-pool');
import { FundamentalData } from '../../types/commons';


@Injectable()
export class FundamentalsCommand implements BotPlugin {

	constructor(
		private notificationService: NotificationService,
		private assetService: AssetService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('fundamentals', async ctx => {
			const args = ctx.state.command.splitArgs;

			const inputTickers = args.filter(t => !!t?.trim()).map(t => t.toUpperCase());

			if(inputTickers.length === 1 && inputTickers[0] === 'ALL'){
				await this.notificationService.sendAssetFundamendalsAll();
				return;
			}

			const subscriptionTickers = ctx.session.subscriptionTickers ?? [];

			const tickers = inputTickers.length ? inputTickers : subscriptionTickers;

			const poolResult = await PromisePool
				.for(tickers)
				.withConcurrency(10)
				.process(async t => {
					const data = await this.assetService.getFundamentals(t)
						.catch(e => null as FundamentalData);

					if (!data) {
						// await ctx.reply(ctx.i18n.t('commands.add-ticker.not-found', { ticker: t }));
						return {
							ticker: t,
							data,
							apply: false,
						};
					}

					return {
						ticker: t,
						data,
						apply: true,
					};
				});

			const goodResults = poolResult.results.filter(r => r.apply);

			for (const r of goodResults) {
				await this.notificationService.sendAssetFundamendals(ctx, r.data);
			}

		})
	}

}
