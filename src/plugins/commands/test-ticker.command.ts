import { AnalysisService } from './../../services/analysis.service';
import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';

@Injectable()
export class TestTickerCommand implements BotPlugin {

	constructor(
		private analysisService: AnalysisService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('test', async ctx => {
			let ticker = ctx.state.command.splitArgs[0];

			if (!ticker) {
				await ctx.reply(ctx.i18n.t('commands.test-ticker.no-ticker-specified'));
				return;
			}

			ticker = ticker.toUpperCase();

			const status = await this.analysisService.getAssetStatus(ticker);
			await ctx.reply(ctx.i18n.t('commands.test-ticker.success', {
				...status.context.marketData,
				status: status.value,
			}));
		})
	}

}
