import { Injectable } from "@nestjs/common";
import { AssetStatus, FundamentalData } from "../types/commons";
import { MyContext, TgSession } from '../types/my-context';
import { AnalysisService } from './analysis.service';
import { AssetService } from './asset.service';
import { BotService } from './bot.service';
import { SessionService } from './session.service';
import { TemplateService } from './template.service';
import PromisePool = require('@supercharge/promise-pool')
import _ = require("lodash");

type AssetNotification<T> = {
	session: TgSession,
	data: T,
};

type Page<T> = {
	pageNum: number;
	pageSize: number;
	totalPages: number;
	totalItems: number;
	items: T[];
};

function paginate<T>(array: T[], size = 15): Page<T>[] {
	return array?.reduce((acc, val, i) => {
		const idx = Math.floor(i / size);
		const page = acc[idx] || (acc[idx] = []);
		page.push(val);
		return acc;
	}, [] as T[][])
		.map((p, i, a) => {
			return {
				pageNum: i + 1,
				pageSize: p.length,
				totalPages: a.length,
				totalItems: array.length,
				items: p,
			} as Page<T>;
		});
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
						return cur
							? {
								...prev,
								[cur.ticker]: cur.collected,
							}
							: prev;
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

	async sendAssetStatusChangesAll() {
		const data = await this.prepareNotifications();

		// send notifications
		for (const n of data.notifications) {
			const message = this.templateService.apply(`change_status`, n.data);
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

	async sendAssetStatusStateAll() {
		await this.collectAndPlay(
			async t => await this.analysisService.getAssetStatus(t),
			async (s, t, d) => {
				if (!d || d.status === 'NONE') {
					return;
				}

				const message = this.templateService.apply(`current_status`, d);
				await this.botService.bot.telegram.sendMessage(s.chatId, message, {
					parse_mode: 'Markdown',
					disable_web_page_preview: true,
				});

			}
		);

	}

	async sendAssetStatusStateAllPages() {

		const sessions: Record<string, AssetStatus[]> = {};

		await this.collectAndPlay(
			async t => await this.analysisService.getAssetStatus(t),
			async (s, t, d) => {
				if (!d || d.status === 'NONE') {
					return;
				}

				sessions[s.chatId] = sessions[s.chatId] || [];
				sessions[s.chatId].push(d);
			}
		);

		const blocks =
			Object.entries(sessions)
				.map(([k, v]) => {
					return paginate(v)
						.map(p => {
							return {
								chatId: k,
								page: p,
							}
						});
				});

		await PromisePool
			.withConcurrency(10)
			.for(blocks)
			.process(async pages => {
				for (const p of pages) {
					const message = this.templateService.apply(`current_status_page`, p.page);
					await this.botService.bot.telegram.sendMessage(p.chatId, message, {
						parse_mode: 'Markdown',
						disable_web_page_preview: true,
					});
				}
			});

	}

	async sendAssetStatus(ctx: MyContext, status: AssetStatus) {
		const message = this.templateService.apply(`current_status`, status);
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

}
