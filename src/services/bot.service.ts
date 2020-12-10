import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync } from 'fs';
import Telegraf from 'telegraf';
import { BotPlugin } from '../types/bot-plugin';
import { MyContext, Session } from '../types/my-context';
import { AnalysisService, AssetStatus } from './analysis.service';
import { AssetService } from './asset.service';
import { SessionService } from './session.service';
import PromisePool = require('@supercharge/promise-pool')

export type AssetStatusNotification = {
	session: Session,
	status: AssetStatus,
}

@Injectable()
export class BotService {

	private readonly bot: Telegraf<MyContext>;

	constructor(
		private assetService: AssetService,
		private sessionService: SessionService,
		private analysisService: AnalysisService,
	) {
		const mode : 'staging' | 'production' = 'production';
		const tokenFilePath = `bot-token-${mode}.txt`;
		const token = readFileSync(tokenFilePath, 'utf8').trim();
		this.bot = new Telegraf<MyContext>(token);
	}

	private registerPlugins(plugins: BotPlugin[]) {
		for (const plugin of plugins) {
			plugin.register(this.bot);
		}
	}

	private async configure() {
		await this.bot.telegram.setMyCommands([
			{ command: 'add', description: 'Добавить тикер для отслеживания' },
			{ command: 'list', description: 'Показать список тикеров в подписке' },
		]);
	}

	createBot(plugins?: BotPlugin[]) {
		this.bot.catch(async (error: any, ctx: MyContext) => {
			console.error('telegraf error ocurred', error);
			await ctx.reply(`Error: \n${error}`);
		});

		this.bot.start(async ctx => {
			await this.configure();
		});

		if (plugins) {
			this.registerPlugins(plugins);
		}

		// await this.configure();

		return this.bot;
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

	async notifyAll() {
		const data = await this.prepareNotifications();

		// send notifications
		for (const n of data.notifications) {
			const message = `
Тикер: ${n.status.ticker}
Статус: ${n.status.status}
Цена: ${n.status.marketData.price}
Верхняя граница: ${n.status.marketData.donchian.maxValue}
Нижняя граница: ${n.status.marketData.donchian.minValue}
			`
			await this.bot.telegram.sendMessage(n.session.chatId, message);
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

}
