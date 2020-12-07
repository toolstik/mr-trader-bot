import { AssetService } from './services/asset.service';
import { ListTickerCommand } from './plugins/commands/list-ticker.command';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';
import { CommandArgsPlugin } from './plugins/command-args.plugin';
import { I18nPlugin } from './plugins/i18n.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { BotPlugin } from './types/bot-plugin';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotService } from './services/bot.service';
import { TestTickerCommand } from './plugins/commands/test-ticker.command';
import { UpdateHistoryCommand } from './plugins/commands/update-history.command';



export async function start() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const module = app.select(AppModule);
	const service = module.get(BotService);

	const pluginTypes = [
		SessionPlugin,
		I18nPlugin,
		CommandArgsPlugin,

		AddTickerCommand,
		ListTickerCommand,
		TestTickerCommand,
		UpdateHistoryCommand,
	];
	const plugins: BotPlugin[] = pluginTypes.map(t => module.get(t));

	const assetService = module.get(AssetService);

	return {
		bot: await service.createBot(plugins),
		updateHistory: async () => {
			await assetService.updateHistoryAll(20);
		},
	};
}
