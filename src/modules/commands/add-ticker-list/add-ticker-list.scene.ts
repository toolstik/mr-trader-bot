import PromisePool = require("@supercharge/promise-pool/dist");
import _ = require("lodash");
import { Scene, SceneEnter } from "nestjs-telegraf";
import { AssetListService } from "../../asset-list/asset-list.service";
import { currentContext } from "../../../utils/current-context";
import { AssetService } from "../../asset/asset.service";

@Scene(AddTickerListScene.sceneName)
export class AddTickerListScene {

	static sceneName = 'add-ticker-list';

	constructor(
		private assetService: AssetService,
		private assetListService: AssetListService,
	) { }

	@SceneEnter()
	async enter() {
		const ctx = currentContext();
		await this.process();
		await ctx.scene.leave();
	}

	private async process() {
		const ctx = currentContext();
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
	}

}
