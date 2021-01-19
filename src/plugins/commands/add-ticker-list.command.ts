import { Injectable } from "@nestjs/common";
import * as _ from 'lodash';
import Telegraf from 'telegraf';
import { AssetService } from '../../services/asset.service';
import { YahooService } from '../../services/yahoo.service';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import { AssetListService } from './../../services/asset-list.service';
import { ListKey } from './../../types/commons';

@Injectable()
export class AddTickerListCommand implements BotPlugin {

	constructor(
		private assetService: AssetService,
		private yahooService: YahooService,
		private assetListService: AssetListService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('addlist', async ctx => {
			const args = ctx.state.command.splitArgs;

			const listKey = (args.filter(t => !!t)[0] || '').toLowerCase();

			if (!listKey) {
				await ctx.reply(
					ctx.i18n.t('commands.add-ticker-list.no-list-specified'),
					{ parse_mode: 'Markdown' },
				);
				return;
			}

			if(!this.assetListService.isKnownList(listKey)){
				await ctx.reply(
					ctx.i18n.t('commands.add-ticker-list.unknown-list'),
					{ parse_mode: 'Markdown' },
				);
				return;
			}

			const addTickers = await this.assetListService.getListTickers(listKey);
			const tickers = ctx.session.subscriptionTickers ?? [];
			const tickersToAdd = _.without(addTickers, ...tickers);

			await ctx.reply(
				ctx.i18n.t(
					'commands.add-ticker-list.please-wait',
					{
						count: tickersToAdd.length,
					}
				),
				{
					parse_mode: 'Markdown',
				}
			);

			if (tickersToAdd.length) {
				const newTickers = _.uniq([...tickers, ...tickersToAdd]).sort();
				ctx.session.subscriptionTickers = newTickers;

				await this.assetService.updateHistory(tickersToAdd);

				await ctx.reply(
					ctx.i18n.t(
						'commands.add-ticker-list.success',
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
