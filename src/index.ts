import { NestFactory } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { AppModule } from './app.module';
import { AssetService } from './modules/asset/asset.service';
import { Configuration } from './modules/global/configuration';
import { PlainLogger } from './modules/global/plain-logger';
import { NotificationService } from './modules/notification/notification.service';
import { MyContext } from './types/my-context';

export async function start() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const module = app.select(AppModule);

  const notificationService = module.get(NotificationService);
  const assetService = module.get(AssetService);
  const configService = module.get(Configuration);
  const logger = module.get(PlainLogger);

  const bot: Telegraf<MyContext> = module.get(getBotToken()); //botService.createBot(plugins);

  return {
    env: configService.env,
    bot: bot,
    log: logger,
    updateHistory: async () => {
      await assetService.updateHistory();
    },
    notify: async () => {
      await notificationService.sendAssetStatusChangesAll();
    },
    status: async () => {
      await notificationService.sendAssetStatusStatePages();
    },
    fundamentals: async () => {
      await notificationService.sendAssetFundamentalsAll();
    },
  };
}
