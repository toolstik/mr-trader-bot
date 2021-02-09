import { BotPlugin } from './../../types/bot-plugin';
import { Injectable, Logger } from "@nestjs/common";
import * as _ from 'lodash';
import { AssetService } from '../../services/asset.service';
import { BotCommand } from "../../types/bot-command";
import { MyContext } from "../../types/my-context";
import { AssetListService } from './../../services/asset-list.service';
import { ListKey } from './../../types/commons';
import Telegraf from 'telegraf';

@Injectable()
export class AddTickerListCommand implements BotPlugin {

	constructor(
		private log: Logger,
		private assetService: AssetService,
		private assetListService: AssetListService,
	) {
		// super(log);
	}


	alias(): string[] {
		return ['addlist'];
	}
	description(): string {
		return null;
	}

	register(bot: Telegraf<MyContext>) {
		// protected async process(ctx: MyContext): Promise<void> {
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

			if (!this.assetListService.isKnownList(listKey)) {
				await ctx.reply(
					ctx.i18n.t('commands.add-ticker-list.unknown-list'),
					{ parse_mode: 'Markdown' },
				);
				return;
			}

			const addTickers = await this.assetListService.getListTickers(listKey);
			const tickers = ctx.session.subscriptionTickers ?? [];
			const absentTickers = _.without(addTickers, ...tickers);

			const tickersToAdd = absentTickers;

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

				const updateResult = await this.assetService.updateHistory(tickersToAdd);

				await ctx.reply(
					ctx.i18n.t(
						'commands.add-ticker-list.success',
						{
							key: listKey,
							errors: updateResult.errors?.length
								? updateResult.errors.map(e => e.item).join(', ')
								: 'no errors',
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
