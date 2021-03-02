import { NestFactory } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { AppModule } from './app.module';
import { AssetService } from './modules/asset/asset.service';
import { ConfigService } from './modules/global/config.service';
import { NotificationService } from './modules/notification/notification.service';
import { MyContext } from './types/my-context';

export async function start() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const module = app.select(AppModule);

  const notificationService = module.get(NotificationService);
  const assetService = module.get(AssetService);
  const configService = module.get(ConfigService);

  const bot: Telegraf<MyContext> = module.get(getBotToken()); //botService.createBot(plugins);

  return {
    env: configService.getEnv(),
    bot: bot,
    updateHistory: async () => {
      await assetService.updateHistory();
    },
    notify: async () => {
      await notificationService.sendAssetStatusChangesAll();
    },
    status: async () => {
      await notificationService.sendAssetStatusStateAllPages();
    },
    fundamentals: async () => {
      await notificationService.sendAssetFundamentalsAll();
    },
  };
}
