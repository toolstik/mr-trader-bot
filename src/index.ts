import { I18nPlugin } from './plugins/i18n.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { BotPlugin } from './interfaces/bot-plugin';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotService } from './services/bot.service';



export async function start() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const module = app.select(AppModule);
	const service = module.get(BotService);

	const pluginTypes = [
		SessionPlugin,
		I18nPlugin,
	];
	const plugins: BotPlugin[] = pluginTypes.map(t => module.get(t));

	return await service.createBot(plugins);
}
