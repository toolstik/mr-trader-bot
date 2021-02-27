import { NestFactory } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { AppModule } from './app.module';
import { ConfigService } from './modules/global/config.service';
import { MyContext } from './types/my-context';

export async function start() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const module = app.select(AppModule);

  // const pluginTypes = [
  // 	SessionPlugin,
  // 	I18nPlugin,
  // 	CommandArgsPlugin,

  // 	MenuPlugin,

  // 	AddTickerCommand,
  // 	RemoveTickerCommand,
  // 	ListTickerCommand,
  // 	TestTickerCommand,
  // 	UpdateHistoryCommand,
  // 	NotifyCommand,
  // 	FundamentalsCommand,
  // 	AddTickerListCommand,
  // 	RemoveTickerListCommand,
  // ];
  // const plugins: BotPlugin[] = pluginTypes.map(t => module.get(t));

  // const botService = module.get(BotService);
  // const notificationService = module.get(NotificationService);
  // const assetService = module.get(AssetService);
  const configService = module.get(ConfigService);

  const bot: Telegraf<MyContext> = app.get(getBotToken()); //botService.createBot(plugins);

  return {
    env: configService.getEnv(),
    bot: bot,
    // updateHistory: async () => {
    // 	await assetService.updateHistory();
    // },
    // notify: async () => {
    // 	await notificationService.sendAssetStatusChangesAll();
    // },
    // status: async () => {
    // 	await notificationService.sendAssetStatusStateAllPages();
    // },
    // fundamentals: async () => {
    // 	await notificationService.sendAssetFundamendalsAll();
    // },
  };
}
