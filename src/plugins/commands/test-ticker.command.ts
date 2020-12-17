import { TemplateService } from './../../services/template.service';
import { AnalysisService } from './../../services/analysis.service';
import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';
import { AssetStatusNotification } from '../../types/commons';

@Injectable()
export class TestTickerCommand implements BotPlugin {

	constructor(
		private analysisService: AnalysisService,
		private templateService: TemplateService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('test', async ctx => {
			const args = ctx.state.command.splitArgs;

			const tickers = args.filter(t => !!t).map(t => t.toUpperCase());

			if (!tickers?.length) {
				await ctx.reply(ctx.i18n.t('commands.test-ticker.no-ticker-specified'));
				return;
			}

			for (const ticker of tickers) {
				const status = await this.analysisService.getAssetStatus(ticker);

				if (!status) {
					await ctx.reply(ctx.i18n.t('commands.test-ticker.ticker-not-found', { ticker }));
					return;
				}

				const notification = {
					session: ctx.session,
					status,
				} as AssetStatusNotification;

				await ctx.replyWithMarkdown(
					this.templateService.apply(`asset-status/${notification.status.status}`, notification.status),
				);
			}
		})
	}

}
