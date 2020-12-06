import { BotPlugin } from './../interfaces/bot-plugin';
import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync } from 'fs';
import Telegraf from 'telegraf';

import { MyContext } from '../interfaces/my-context';
import { FirebaseService } from './firebase.service';

@Injectable()
export class BotService {

	private readonly bot: Telegraf<MyContext>;

	constructor() {
		const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt';
		const token = readFileSync(tokenFilePath, 'utf8').trim();
		this.bot = new Telegraf<MyContext>(token);
	}


	private registerCommands() {
		const bot = this.bot;

		bot.command('getid', async context => {
			await context.reply(`${context.chat.id}`);
		});

		bot.catch((error: any) => {
			console.error('telegraf error ocurred', error);
		});

		return this.bot;
	}

	private registerPlugins(plugins: BotPlugin[]) {
		for (const plugin of plugins) {
			plugin.register(this.bot);
		}
	}

	private async configure() {
		await this.bot.telegram.setMyCommands([
			{ command: 'start', description: 'open the menu' },
			{ command: 'help', description: 'show the help' },
			{ command: 'settings', description: 'open the settings' },
		]);
	}

	async createBot(plugins?: BotPlugin[]) {
		this.registerCommands();

		if (plugins) {
			this.registerPlugins(plugins);
		}

		await this.configure();

		return this.bot;
	}

}
