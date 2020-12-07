import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommandArgsPlugin } from './plugins/command-args.plugin';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';
import { ListTickerCommand } from './plugins/commands/list-ticker.command';
import { NotifyCommand } from './plugins/commands/notify.command';
import { TestTickerCommand } from './plugins/commands/test-ticker.command';
import { UpdateHistoryCommand } from './plugins/commands/update-history.command';
import { I18nPlugin } from './plugins/i18n.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { AssetService } from './services/asset.service';
import { BotService } from './services/bot.service';
import { BotPlugin } from './types/bot-plugin';



export async function start() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const module = app.select(AppModule);

	const pluginTypes = [
		SessionPlugin,
		I18nPlugin,
		CommandArgsPlugin,

		AddTickerCommand,
		ListTickerCommand,
		TestTickerCommand,
		UpdateHistoryCommand,
		NotifyCommand,
	];
	const plugins: BotPlugin[] = pluginTypes.map(t => module.get(t));

	const botService = module.get(BotService);
	const assetService = module.get(AssetService);

	return {
		bot: botService.createBot(plugins),
		updateHistory: async () => {
			await assetService.updateHistory();
		},
		notify: async () => {
			await botService.notifyAll();
		},
	};
}
