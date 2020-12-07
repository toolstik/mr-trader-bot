import { BotPlugin } from '../types/bot-plugin';
import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync } from 'fs';
import Telegraf from 'telegraf';

import { MyContext } from '../types/my-context';
import { FirebaseService } from './firebase.service';

@Injectable()
export class BotService {

	private readonly bot: Telegraf<MyContext>;

	constructor() {
		const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt';
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

	async createBot(plugins?: BotPlugin[]) {
		this.bot.catch((error: any) => {
			console.error('telegraf error ocurred', error);
		});

		if (plugins) {
			this.registerPlugins(plugins);
		}

		await this.configure();

		return this.bot;
	}

}
