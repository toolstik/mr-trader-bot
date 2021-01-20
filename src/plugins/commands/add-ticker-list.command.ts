import { Injectable, Logger } from "@nestjs/common";
import * as _ from 'lodash';
import { AssetService } from '../../services/asset.service';
import { BotCommand } from "../../types/bot-command";
import { MyContext } from "../../types/my-context";
import { AssetListService } from './../../services/asset-list.service';
import { ListKey } from './../../types/commons';

@Injectable()
export class AddTickerListCommand extends BotCommand {

	constructor(
		private log: Logger,
		private assetService: AssetService,
		private assetListService: AssetListService,
	) {
		super(log);
	}

	alias(): string[] {
		return ['addlist'];
	}
	description(): string {
		return null;
	}
	protected async process(ctx: MyContext): Promise<void> {
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

		this.log.debug('STEP BEFORE UPDATE');

		if (tickersToAdd.length) {
			const newTickers = _.uniq([...tickers, ...tickersToAdd]).sort();
			ctx.session.subscriptionTickers = newTickers;

			try {
				await this.assetService.updateHistory(tickersToAdd);
			}
			catch (e) {
				this.log.debug(e);
				throw e;
			}

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
	}

}
