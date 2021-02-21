import { Injectable } from "@nestjs/common";
import * as _ from 'lodash';
import { Telegraf } from 'telegraf';
import { AssetListService } from '../../services/asset-list.service';
import { BotPlugin } from "../../types/bot-plugin";
import { ListKey } from '../../types/commons';
import { MyContext } from "../../types/my-context";

@Injectable()
export class RemoveTickerListCommand implements BotPlugin {

	constructor(
		private assetListService: AssetListService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('removelist', async ctx => {
			const args = ctx.state.command.splitArgs;

			const listKey = (args.filter(t => !!t)[0] || '').toLowerCase();

			if (!listKey) {
				await ctx.reply(
					ctx.i18n.t('commands.remove-ticker-list.no-list-specified'),
					{ parse_mode: 'Markdown' },
				);
				return;
			}

			if(!this.assetListService.isKnownList(listKey)){
				await ctx.reply(
					ctx.i18n.t('commands.remove-ticker-list.unknown-list'),
					{ parse_mode: 'Markdown' },
				);
				return;
			}

			const removeTickers = await this.assetListService.getListTickers(listKey);
			const tickers = ctx.session.subscriptionTickers ?? [];
			const tickersToRemove = _.intersection(removeTickers, tickers);

			if (tickersToRemove.length) {
				const newTickers = _.without(tickers, ...tickersToRemove).sort();
				ctx.session.subscriptionTickers = newTickers;

				await ctx.reply(
					ctx.i18n.t(
						'commands.remove-ticker-list.success',
						{
							key: listKey,
						}
					),
					{
						parse_mode: 'Markdown',
					}
				);
			}
		})
	}



}
