import { Injectable } from "@nestjs/common";
import { Telegraf } from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import { AnalysisService } from './../../services/analysis.service';
import { NotificationService } from './../../services/notification.service';
import { TemplateService } from './../../services/template.service';

@Injectable()
export class TestTickerCommand implements BotPlugin {

	constructor(
		private analysisService: AnalysisService,
		private templateService: TemplateService,
		private notificationService: NotificationService,
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

				await this.notificationService.sendAssetStatus(ctx, status);
			}
		})
	}

}
