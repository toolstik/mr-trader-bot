import { Injectable } from "@nestjs/common";
import { AssetStatus, FundamentalData } from "../types/commons";
import { MyContext, TgSession } from '../types/my-context';
import { AnalysisService } from './analysis.service';
import { AssetService } from './asset.service';
import { BotService } from './bot.service';
import { SessionService } from './session.service';
import { TemplateService } from './template.service';
import PromisePool = require('@supercharge/promise-pool')

type AssetNotification<T> = {
	session: TgSession,
	data: T,
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

	private async collectAndPlay<T>(
		collect: (ticket: string) => Promise<T | false>,
		play: (session: TgSession, ticker: string, data: T) => Promise<void>,
	) {
		const sessions = await this.sessionService.getSessions();
		const tickers = await this.sessionService.getAllSessionTickers();

		const dict = await PromisePool
			.withConcurrency(10)
			.for(tickers)
			.process(async ticker => {
				const collected = await collect(ticker);

				if (!collected) {
					return null;
				}

				return {
					ticker,
					collected,
				}
			})
			.then(r => {
				return r.results
					.filter(i => !!i)
					.reduce((prev, cur) => {
						return {
							...prev,
							[cur.ticker]: cur.collected,
						}
					}, {} as Record<string, T>)
			});

		for (const session of sessions) {
			if (!session?.subscriptionTickers) {
				continue;
			}

			for (const ticker of session.subscriptionTickers) {
				const data = dict[ticker];
				if (data) {
					await play(session, ticker, data);
				}
			}
		}

		return dict;
	}

	private async prepareNotifications() {

		const notifications: AssetNotification<AssetStatus>[] = [];

		const statuses = await this.collectAndPlay(
			async t => await this.analysisService.getAssetStatus(t),
			async (s, t, d) => {
				if (!d || !d.changed || d.status === 'NONE') {
					return;
				}

				notifications.push({
					session: s,
					data: d,
				});
			}
		);

		return {
			notifications,
			statuses,
		};

	}

	async sentAssetStatusAll() {
		const data = await this.prepareNotifications();

		// send notifications
		for (const n of data.notifications) {
			const message = this.getAssetStatusMessage(n.data);
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

	async sendAssetFundamendals(ctx: MyContext, data: FundamentalData) {
		const message = this.templateService.apply('fundamentals', data);
		return await ctx.replyWithMarkdown(
			message,
			{
				disable_web_page_preview: true,
			},
		);
	}

	async sendAssetFundamendalsAll() {
		await this.collectAndPlay(
			async t => {
				const asset = await this.assetService.getOne(t);

				if (asset.state === 'NONE') {
					return false;
				}

				return await this.assetService.getFundamentals(t);
			},
			async (s, t, d) => {
				const message = this.templateService.apply('fundamentals', d);

				await this.botService.bot.telegram.sendMessage(s.chatId, message, {
					parse_mode: 'Markdown',
					disable_web_page_preview: true,
				});
			}
		);
	}

	private getAssetStatusMessage(status: AssetStatus) {
		return this.templateService.apply(`change_status`, status);
	}

}
