import { Injectable } from "@nestjs/common";
import { AssetStatus } from "../types/commons";
import { MyContext, TgSession } from '../types/my-context';
import { AnalysisService } from './analysis.service';
import { AssetService } from './asset.service';
import { BotService } from './bot.service';
import { SessionService } from './session.service';
import { TemplateService } from './template.service';
import PromisePool = require('@supercharge/promise-pool')

type AssetStatusNotification = {
	session: TgSession,
	status: AssetStatus,
}

@Injectable()
export class NotificationService {

	constructor(
		private assetService: AssetService,
		private sessionService: SessionService,
		private analysisService: AnalysisService,
		private templateService: TemplateService,
		private botService: BotService,
	) {

	}

	private async prepareNotifications() {
		const sessions = await this.sessionService.getSessions();
		const tickers = await this.sessionService.getAllSessionTickers();

		const statuses = await PromisePool
			.withConcurrency(10)
			.for(tickers)
			.process(async ticker => {
				return await this.analysisService.getAssetStatus(ticker);
			})
			.then(r => {
				return r.results
					.filter(i => !!i)
					.reduce((prev, cur) => {
						return {
							...prev,
							[cur.ticker]: cur,
						}
					}, {} as Record<string, AssetStatus>)
			});

		const notifications: AssetStatusNotification[] = [];

		for (const session of sessions) {
			if (!session?.subscriptionTickers) {
				continue;
			}

			for (const ticker of session.subscriptionTickers) {

				const status = statuses[ticker];

				// console.log(++i, session.chatId, ticker, status.changed, status.status);

				if (!status || !status.changed || status.status === 'NONE') {
					continue;
				}

				notifications.push({
					session,
					status,
				});

			}
		}

		return {
			notifications,
			statuses,
		};

	}

	async sentAssetStatusAll() {
		const data = await this.prepareNotifications();

		// send notifications
		for (const n of data.notifications) {
			const message = this.getAssetStatusMessage(n.status);
			await this.botService.bot.telegram.sendMessage(n.session.chatId, message, {
				parse_mode: 'Markdown',
				disable_web_page_preview: true,
			});
		}

		// update statuses
		for (const [key, value] of Object.entries(data.statuses)) {
			if (!value?.changed) {
				continue;
			}

			await this.assetService.updateOne(key, v => ({
				...v,
				state: value.status,
			}));
		}

		return data;
	}

	async sendAssetStatus(ctx: MyContext, status: AssetStatus) {
		const message = this.getAssetStatusMessage(status);
		return await ctx.replyWithMarkdown(
			message,
			{
				disable_web_page_preview: true,
			},
		);
	}

	private getAssetStatusMessage(status: AssetStatus) {
		return this.templateService.apply(`asset-status/${status.status}`, status);
	}

}
