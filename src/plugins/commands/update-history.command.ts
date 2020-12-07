import { AssetService } from './../../services/asset.service';
import { AnalysisService } from '../../services/analysis.service';
import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';

@Injectable()
export class UpdateHistoryCommand implements BotPlugin {

	constructor(
		private assetService: AssetService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('updatehistory', async ctx => {
			// let ticker = ctx.state.command.splitArgs[0];

			// if (!ticker) {
			// 	await ctx.reply(ctx.i18n.t('commands.add-ticker.no-ticker-specified'));
			// 	return;
			// }

			// ticker = ticker.toUpperCase();

			const status = await this.assetService.updateHistoryAll(20);
			const keys = Object.keys(status);
			await ctx.reply(`Обновлены данные по ${keys.length} активам`);
		})
	}

}
