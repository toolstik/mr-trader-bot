import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommandArgsPlugin } from './plugins/command-args.plugin';
import { AddTickerListCommand } from './plugins/commands/add-ticker-list.command';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';
import { FundamentalsCommand } from './plugins/commands/fundamentals.command';
import { ListTickerCommand } from './plugins/commands/list-ticker.command';
import { NotifyCommand } from './plugins/commands/notify.command';
import { RemoveTickerListCommand } from './plugins/commands/remove-ticker-list.command';
import { RemoveTickerCommand } from './plugins/commands/remove-ticker.command';
import { TestTickerCommand } from './plugins/commands/test-ticker.command';
import { UpdateHistoryCommand } from './plugins/commands/update-history.command';
import { I18nPlugin } from './plugins/i18n.plugin';
import { MenuPlugin } from './plugins/menu.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { AssetService } from './services/asset.service';
import { BotService } from './services/bot.service';
import { ConfigService } from './services/config.service';
import { NotificationService } from './services/notification.service';
import { BotPlugin } from './types/bot-plugin';

export async function start() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const module = app.select(AppModule);

	const pluginTypes = [
		SessionPlugin,
		I18nPlugin,
		CommandArgsPlugin,

		MenuPlugin,

		AddTickerCommand,
		RemoveTickerCommand,
		ListTickerCommand,
		TestTickerCommand,
		UpdateHistoryCommand,
		NotifyCommand,
		FundamentalsCommand,
		AddTickerListCommand,
		RemoveTickerListCommand,
	];
	const plugins: BotPlugin[] = pluginTypes.map(t => module.get(t));

	const botService = module.get(BotService);
	const notificationService = module.get(NotificationService);
	const assetService = module.get(AssetService);
	const configService = module.get(ConfigService);

	return {
		env: configService.getEnv(),
		bot: botService.createBot(plugins),
		updateHistory: async () => {
			await assetService.updateHistory();
		},
		notify: async () => {
			await notificationService.sentAssetStatusAll();
		},
		fundamentals: async () => {
			await notificationService.sendAssetFundamendalsAll();
		},
	};
}
